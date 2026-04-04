// "use client"

// import { useState, useEffect } from "react"
// // import { createClient } from "@/lib/supabase/client"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Textarea } from "@/components/ui/textarea"
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog"
// import { cn } from "@/lib/utils"
// import type { Role, Goal } from "@/lib/types"
// import { ROLE_COLORS } from "@/lib/types"

// export default function RolesPage() {
//   const [roles, setRoles] = useState<Role[]>([])
//   const [loading, setLoading] = useState(true)
//   const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)
//   const [isAddGoalOpen, setIsAddGoalOpen] = useState(false)
//   const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
//   const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set())
  
//   // Form states
//   const [newRoleName, setNewRoleName] = useState("")
//   const [newRoleDescription, setNewRoleDescription] = useState("")
//   const [newRoleColor, setNewRoleColor] = useState(ROLE_COLORS[0])
//   const [newGoalName, setNewGoalName] = useState("")
//   const [newGoalDescription, setNewGoalDescription] = useState("")

//   const supabase = createClient()

//   useEffect(() => {
//     fetchRoles()
//   }, [])

//   const fetchRoles = async () => {
//     const { data: rolesData, error: rolesError } = await supabase
//       .from("roles")
//       .select("*")
//       .order("created_at", { ascending: true })

//     if (rolesError) {
//       console.error("Error fetching roles:", rolesError)
//       return
//     }

//     // Fetch goals for each role
//     const rolesWithGoals = await Promise.all(
//       (rolesData || []).map(async (role) => {
//         const { data: goalsData } = await supabase
//           .from("goals")
//           .select("*")
//           .eq("role_id", role.id)
//           .order("created_at", { ascending: true })
        
//         return { ...role, goals: goalsData || [] }
//       })
//     )

//     setRoles(rolesWithGoals)
//     setLoading(false)
//   }

//   const handleAddRole = async () => {
//     if (!newRoleName.trim()) return

//     const { data: { user } } = await supabase.auth.getUser()
//     if (!user) return

//     const { error } = await supabase.from("roles").insert({
//       user_id: user.id,
//       name: newRoleName.trim(),
//       description: newRoleDescription.trim() || null,
//       color: newRoleColor,
//     })

//     if (error) {
//       console.error("Error adding role:", error)
//       return
//     }

//     setNewRoleName("")
//     setNewRoleDescription("")
//     setNewRoleColor(ROLE_COLORS[0])
//     setIsAddRoleOpen(false)
//     fetchRoles()
//   }

//   const handleDeleteRole = async (roleId: string) => {
//     const { error } = await supabase.from("roles").delete().eq("id", roleId)
//     if (error) {
//       console.error("Error deleting role:", error)
//       return
//     }
//     fetchRoles()
//   }

//   const handleAddGoal = async () => {
//     if (!newGoalName.trim() || !selectedRoleId) return

//     const { data: { user } } = await supabase.auth.getUser()
//     if (!user) return

//     const { error } = await supabase.from("goals").insert({
//       user_id: user.id,
//       role_id: selectedRoleId,
//       name: newGoalName.trim(),
//       description: newGoalDescription.trim() || null,
//       quadrant: 2,
//     })

//     if (error) {
//       console.error("Error adding goal:", error)
//       return
//     }

//     setNewGoalName("")
//     setNewGoalDescription("")
//     setSelectedRoleId(null)
//     setIsAddGoalOpen(false)
//     fetchRoles()
//   }

//   const handleDeleteGoal = async (goalId: string) => {
//     const { error } = await supabase.from("goals").delete().eq("id", goalId)
//     if (error) {
//       console.error("Error deleting goal:", error)
//       return
//     }
//     fetchRoles()
//   }

//   const toggleRoleExpanded = (roleId: string) => {
//     setExpandedRoles((prev) => {
//       const newSet = new Set(prev)
//       if (newSet.has(roleId)) {
//         newSet.delete(roleId)
//       } else {
//         newSet.add(roleId)
//       }
//       return newSet
//     })
//   }

//   const openAddGoalDialog = (roleId: string) => {
//     setSelectedRoleId(roleId)
//     setIsAddGoalOpen(true)
//   }

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-full">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
//       </div>
//     )
//   }

//   return (
//     <div className="p-8 max-w-5xl mx-auto">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-8">
//         <div>
//           <h1 className="text-3xl font-serif font-bold text-foreground">Roles & Goals</h1>
//           <p className="text-muted-foreground mt-1">
//             Define the roles you play in life and set meaningful goals for each.
//           </p>
//         </div>
//         <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
//           <DialogTrigger asChild>
//             <Button>
//               <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//               </svg>
//               Add Role
//             </Button>
//           </DialogTrigger>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Add New Role</DialogTitle>
//               <DialogDescription>
//                 A role represents a key area of your life (e.g., Parent, Professional, Friend).
//               </DialogDescription>
//             </DialogHeader>
//             <div className="space-y-4 py-4">
//               <div className="space-y-2">
//                 <label className="text-sm font-medium">Role Name</label>
//                 <Input
//                   placeholder="e.g., Parent, Professional, Friend"
//                   value={newRoleName}
//                   onChange={(e) => setNewRoleName(e.target.value)}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <label className="text-sm font-medium">Description (optional)</label>
//                 <Textarea
//                   placeholder="Describe what this role means to you..."
//                   value={newRoleDescription}
//                   onChange={(e) => setNewRoleDescription(e.target.value)}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <label className="text-sm font-medium">Color</label>
//                 <div className="flex gap-2">
//                   {ROLE_COLORS.map((color) => (
//                     <button
//                       key={color}
//                       onClick={() => setNewRoleColor(color)}
//                       className={cn(
//                         "w-8 h-8 rounded-full transition-transform",
//                         newRoleColor === color && "ring-2 ring-offset-2 ring-primary scale-110"
//                       )}
//                       style={{ backgroundColor: color }}
//                     />
//                   ))}
//                 </div>
//               </div>
//             </div>
//             <DialogFooter>
//               <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>
//                 Cancel
//               </Button>
//               <Button onClick={handleAddRole} disabled={!newRoleName.trim()}>
//                 Add Role
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       </div>

//       {/* Roles Grid */}
//       {roles.length === 0 ? (
//         <Card className="border-dashed">
//           <CardContent className="flex flex-col items-center justify-center py-16">
//             <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
//               <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//               </svg>
//             </div>
//             <h3 className="text-lg font-medium text-foreground mb-2">No roles yet</h3>
//             <p className="text-muted-foreground text-center max-w-sm mb-4">
//               Start by defining the key roles you play in your life. Each role can have multiple goals.
//             </p>
//             <Button onClick={() => setIsAddRoleOpen(true)}>
//               <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//               </svg>
//               Add Your First Role
//             </Button>
//           </CardContent>
//         </Card>
//       ) : (
//         <div className="space-y-4">
//           {roles.map((role) => (
//             <Card key={role.id} className="overflow-hidden">
//               <CardHeader
//                 className="cursor-pointer hover:bg-secondary/50 transition-colors"
//                 onClick={() => toggleRoleExpanded(role.id)}
//               >
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center gap-3">
//                     <div
//                       className="w-4 h-4 rounded-full"
//                       style={{ backgroundColor: role.color }}
//                     />
//                     <div>
//                       <CardTitle className="text-lg">{role.name}</CardTitle>
//                       {role.description && (
//                         <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
//                       )}
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <span className="text-sm text-muted-foreground">
//                       {role.goals?.length || 0} goal{(role.goals?.length || 0) !== 1 ? "s" : ""}
//                     </span>
//                     <svg
//                       className={cn(
//                         "w-5 h-5 text-muted-foreground transition-transform",
//                         expandedRoles.has(role.id) && "rotate-180"
//                       )}
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                     </svg>
//                   </div>
//                 </div>
//               </CardHeader>
//               {expandedRoles.has(role.id) && (
//                 <CardContent className="border-t border-border pt-4">
//                   {/* Goals List */}
//                   {role.goals && role.goals.length > 0 ? (
//                     <div className="space-y-3 mb-4">
//                       {role.goals.map((goal) => (
//                         <div
//                           key={goal.id}
//                           className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
//                         >
//                           <div className="flex items-center gap-3">
//                             <div className="w-2 h-2 rounded-full bg-primary" />
//                             <div>
//                               <p className="font-medium text-foreground">{goal.name}</p>
//                               {goal.description && (
//                                 <p className="text-sm text-muted-foreground">{goal.description}</p>
//                               )}
//                             </div>
//                           </div>
//                           <Button
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => handleDeleteGoal(goal.id)}
//                             className="text-muted-foreground hover:text-destructive"
//                           >
//                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                             </svg>
//                           </Button>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <p className="text-muted-foreground text-sm mb-4">No goals yet for this role.</p>
//                   )}
                  
//                   {/* Actions */}
//                   <div className="flex items-center gap-2">
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => openAddGoalDialog(role.id)}
//                     >
//                       <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
//                       </svg>
//                       Add Goal
//                     </Button>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       onClick={() => handleDeleteRole(role.id)}
//                       className="text-muted-foreground hover:text-destructive"
//                     >
//                       <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
//                       </svg>
//                       Delete Role
//                     </Button>
//                   </div>
//                 </CardContent>
//               )}
//             </Card>
//           ))}
//         </div>
//       )}

//       {/* Add Goal Dialog */}
//       <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Add New Goal</DialogTitle>
//             <DialogDescription>
//               Set a meaningful goal for this role. Focus on Quadrant II activities - important but not urgent.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="space-y-4 py-4">
//             <div className="space-y-2">
//               <label className="text-sm font-medium">Goal Name</label>
//               <Input
//                 placeholder="e.g., Improve communication with family"
//                 value={newGoalName}
//                 onChange={(e) => setNewGoalName(e.target.value)}
//               />
//             </div>
//             <div className="space-y-2">
//               <label className="text-sm font-medium">Description (optional)</label>
//               <Textarea
//                 placeholder="Describe this goal in more detail..."
//                 value={newGoalDescription}
//                 onChange={(e) => setNewGoalDescription(e.target.value)}
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={() => setIsAddGoalOpen(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleAddGoal} disabled={!newGoalName.trim()}>
//               Add Goal
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   )
// }
