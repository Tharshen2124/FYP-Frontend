"use client"

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
import { ROLE_COLORS, ROLE_ICONS } from "../_constants/roles"

interface Props {
  open: boolean
  mode: "add" | "edit"
  name: string
  iconId: string
  colorId: string
  onOpenChange: (open: boolean) => void
  onNameChange: (name: string) => void
  onIconChange: (iconId: string) => void
  onColorChange: (colorId: string) => void
  onCancel: () => void
  onSubmit: () => void
}

export function RoleFormDialog({
  open,
  mode,
  name,
  iconId,
  colorId,
  onOpenChange,
  onNameChange,
  onIconChange,
  onColorChange,
  onCancel,
  onSubmit,
}: Props) {
  const isAdd = mode === "add"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{isAdd ? "Add New Role" : "Edit Role"}</DialogTitle>
          <DialogDescription className="text-muted-foreground font-serif">
            {isAdd
              ? "Define a role that represents an important area of your life."
              : "Update the details for this role."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-foreground" htmlFor={`role-name-${mode}`}>Role Name</Label>
            <Input
              id={`role-name-${mode}`}
              placeholder="e.g., Parent, Manager, Student..."
              value={name}
              onChange={e => onNameChange(e.target.value)}
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
                    aria-label={item.label}
                    className={`p-3 rounded-xl border-2 transition-all ${iconId === item.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                  >
                    <IconComp className={`w-6 h-6 mx-auto ${iconId === item.id ? "text-primary" : "text-muted-foreground"}`} />
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
                  aria-label={color.label}
                  className={`w-10 h-10 rounded-full transition-all ${colorId === color.id ? "ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: color.value }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} className="border-border text-foreground hover:bg-secondary/20">Cancel</Button>
          <Button onClick={onSubmit} disabled={!name.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            {isAdd ? "Add Role" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
