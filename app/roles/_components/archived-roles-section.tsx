"use client"

import { RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FALLBACK_ROLE_ICON, getColor, ROLE_ICON_BY_ID } from "../_utils/roles"
import type { ArchivedRole } from "../_types"

interface Props {
  roles: ArchivedRole[]
  onRestore: (roleId: string) => void
}

/**
 * Archived roles are listed rather than hidden: the weeks they appear in are still in your history,
 * and taking one back up again is a normal thing to do.
 */
export function ArchivedRolesSection({ roles, onRestore }: Props) {
  if (roles.length === 0) return null

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-foreground mb-1">Archived</h2>
      <p className="text-sm text-muted-foreground font-serif mb-4">
        Kept out of new weekly plans. Past weeks still show them.
      </p>

      <div className="grid gap-2">
        {roles.map(role => {
          const IconComponent = ROLE_ICON_BY_ID[role.iconId] ?? FALLBACK_ROLE_ICON
          const color = getColor(role.colorId)

          return (
            <div key={role.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 opacity-60" style={{ backgroundColor: `${color}20` }}>
                  <IconComponent className="w-4 h-4" style={{ color }} />
                </div>
                <span className="font-bold text-muted-foreground truncate">{role.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRestore(role.id)}
                aria-label={`Restore ${role.name}`}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Restore
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
