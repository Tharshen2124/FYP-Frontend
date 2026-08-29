import { describe, it, expect } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative, sep } from "node:path"

const APP_DIR = join(process.cwd(), "app")

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

const sourceFiles = walk(APP_DIR).filter(f => f.endsWith(".ts") || f.endsWith(".tsx"))
const relPaths = sourceFiles.map(f => relative(process.cwd(), f))

/** The route segment that owns a private folder, e.g. "app/weekly-plan" for app/weekly-plan/_types/x.ts */
function privateOwner(relPath: string): string | null {
  const parts = relPath.split(sep)
  const idx = parts.findIndex(p => p.startsWith("_"))
  return idx === -1 ? null : parts.slice(0, idx).join("/")
}

describe("file naming", () => {
  it("uses kebab-case for every source file under app/", () => {
    const offenders = relPaths.filter(p => {
      const name = p.split(sep).pop()!.replace(/\.tsx?$/, "")
      return !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)
    })
    expect(offenders).toEqual([])
  })

  it("uses only the four sanctioned private folder names", () => {
    const allowed = new Set(["_types", "_constants", "_utils", "_components"])
    const offenders = relPaths
      .flatMap(p => p.split(sep).filter(seg => seg.startsWith("_")))
      .filter(seg => !allowed.has(seg))
    expect([...new Set(offenders)]).toEqual([])
  })
})

describe("private folder boundaries", () => {
  const importRe = /from\s+"(@\/app\/[^"]+)"/g

  it("never imports another route's private folder", () => {
    const violations: string[] = []

    for (const file of sourceFiles) {
      const rel = relative(process.cwd(), file)
      const owner = privateOwner(rel)
      const src = readFileSync(file, "utf8")

      for (const match of src.matchAll(importRe)) {
        const spec = match[1]
        if (!/\/_(types|constants|utils|components)(\/|$)/.test(spec)) continue

        // "@/app/weekly-plan/_constants/mock-data" → owning segment "app/weekly-plan"
        const parts = spec.replace(/^@\//, "").split("/")
        const targetOwner = parts.slice(0, parts.findIndex(p => p.startsWith("_"))).join("/")

        // Allowed only when the importing file lives under the owning segment.
        const importerSegment = owner ?? rel.split(sep).slice(0, -1).join("/")
        if (!importerSegment.startsWith(targetOwner)) {
          violations.push(`${rel} imports ${spec}`)
        }
      }
    }

    expect(violations).toEqual([])
  })

  it("addresses its own private folders relatively, not through the @/app alias", () => {
    const violations: string[] = []

    for (const file of sourceFiles) {
      const rel = relative(process.cwd(), file)
      const src = readFileSync(file, "utf8")
      for (const match of src.matchAll(importRe)) {
        if (/\/_(types|constants|utils|components)(\/|$)/.test(match[1])) {
          violations.push(`${rel} imports ${match[1]}`)
        }
      }
    }

    expect(violations).toEqual([])
  })
})

describe("page orchestrators stay slim", () => {
  const pages = relPaths.filter(p => p.endsWith(`${sep}page.tsx`))

  it("finds every route page", () => {
    // 19 user-facing routes plus /admin/dashboard.
    expect(pages.length).toBe(20)
  })

  it("keeps each page under 250 lines", () => {
    const tooLong = pages
      .map(p => [p, readFileSync(join(process.cwd(), p), "utf8").split("\n").length] as const)
      .filter(([, lines]) => lines > 250)
    expect(tooLong).toEqual([])
  })
})
