import { ShieldAlert } from "lucide-react"

/**
 * What the page says to an account that is signed in and not an admin.
 *
 * Rendered in place of the grid rather than redirected away, the same shape `/analytics` uses for
 * its Premium refusal: the heading and the sidebar stay, so this reads as the page answering a
 * question rather than as a bounce with a fading message.
 *
 * It makes no offer. The Premium refusal has one — pay, and the feature opens — and this one
 * cannot: admin is not for sale, and a button here would only be a button that does nothing.
 */
export function AdminDenied() {
  return (
    <div className="p-6 rounded-2xl bg-card border-2 border-border max-w-xl">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <ShieldAlert className="w-7 h-7 text-muted-foreground" aria-hidden />
      </div>
      <h2 className="text-lg font-bold text-foreground mb-2">This area is for administrators</h2>
      <p className="text-muted-foreground font-serif text-sm">
        Your account is signed in, but it doesn&apos;t have administrator access. If you think that
        is wrong, ask whoever runs this deployment to grant it.
      </p>
    </div>
  )
}
