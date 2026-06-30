import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ROLE_ICONS, ROLE_COLORS } from "../_constants"

interface Props {
  open: boolean
  mode: "add" | "edit"
  roleName: string
  selectedIcon: string
  selectedColor: string
  onOpenChange: (open: boolean) => void
  onRoleNameChange: (value: string) => void
  onIconChange: (id: string) => void
  onColorChange: (id: string) => void
  onConfirm: () => void
}

export function RoleDialog({
  open,
  mode,
  roleName,
  selectedIcon,
  selectedColor,
  onOpenChange,
  onRoleNameChange,
  onIconChange,
  onColorChange,
  onConfirm,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{mode === "add" ? "Add New Role" : "Edit Role"}</DialogTitle>
          <DialogDescription className="text-muted-foreground font-serif">
            {mode === "add"
              ? "Define a role that represents an important area of your life."
              : "Update the details for this role."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-foreground">Role Name</Label>
            <Input
              placeholder="e.g., Parent, Manager, Student..."
              value={roleName}
              onChange={e => onRoleNameChange(e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Choose an Icon</Label>
            <div className="grid grid-cols-4 gap-2">
              {ROLE_ICONS.map(item => {
                const IconComp = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => onIconChange(item.id)}
                    className={`p-3 rounded-xl border-2 transition-all ${selectedIcon === item.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                  >
                    <IconComp className={`w-6 h-6 mx-auto ${selectedIcon === item.id ? "text-primary" : "text-muted-foreground"}`} />
                  </button>
                )
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Choose a Color</Label>
            <div className="flex gap-2">
              {ROLE_COLORS.map(color => (
                <button
                  key={color.id}
                  onClick={() => onColorChange(color.id)}
                  className={`w-10 h-10 rounded-full transition-all ${selectedColor === color.id ? "ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border text-foreground hover:bg-secondary/20">Cancel</Button>
          <Button onClick={onConfirm} disabled={!roleName.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {mode === "add" ? "Add Role" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
