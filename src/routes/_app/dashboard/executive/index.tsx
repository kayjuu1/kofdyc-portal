import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { Plus, Pencil, Trash2, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getExecutiveMembers,
  createExecutiveMember,
  updateExecutiveMember,
  deleteExecutiveMember,
} from "@/functions/executive"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { hasPermission, type UserRole } from "@/lib/permissions"

export const Route = createFileRoute("/_app/dashboard/executive/")({
  beforeLoad: ({ context }) => {
    const role = ((context.session.user as { role?: string }).role ?? "coordinator") as UserRole
    if (!hasPermission(role, "manageAdminUsers")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  loader: async () => {
    return getExecutiveMembers({ data: { currentOnly: false } })
  },
  component: ExecutiveManagementPage,
})

function ExecutiveManagementPage() {
  const members = Route.useLoaderData()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: "",
    portfolio: "",
    email: "",
    phone: "",
    termYear: new Date().getFullYear().toString(),
    isCurrent: true,
  })

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof createExecutiveMember>[0]["data"]) =>
      createExecutiveMember({ data }),
    onSuccess: () => {
      toast.success("Member added")
      resetForm()
      router.invalidate()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateExecutiveMember>[0]["data"]) =>
      updateExecutiveMember({ data }),
    onSuccess: () => {
      toast.success("Member updated")
      resetForm()
      router.invalidate()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteExecutiveMember({ data: { id } }),
    onSuccess: () => {
      toast.success("Member removed")
      router.invalidate()
    },
  })

  const resetForm = () => {
    setShowForm(false)
    setEditId(null)
    setForm({ name: "", portfolio: "", email: "", phone: "", termYear: new Date().getFullYear().toString(), isCurrent: true })
  }

  const handleEdit = (member: typeof members[0]) => {
    setEditId(member.id)
    setForm({
      name: member.name,
      portfolio: member.portfolio,
      email: member.email ?? "",
      phone: member.phone ?? "",
      termYear: member.termYear,
      isCurrent: member.isCurrent,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editId) {
      updateMutation.mutate({
        id: editId,
        name: form.name,
        portfolio: form.portfolio,
        email: form.email || undefined,
        phone: form.phone || undefined,
        termYear: form.termYear,
        isCurrent: form.isCurrent,
      })
    } else {
      createMutation.mutate({
        name: form.name,
        portfolio: form.portfolio,
        email: form.email || undefined,
        phone: form.phone || undefined,
        termYear: form.termYear,
        isCurrent: form.isCurrent,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Executive Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage DYC Executive members</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editId ? "Edit Member" : "Add Executive Member"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="grid gap-2">
                  <Label>Portfolio *</Label>
                  <Input value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })} placeholder="e.g., President, Secretary" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Term Year</Label>
                  <Input value={form.termYear} onChange={(e) => setForm({ ...form, termYear: e.target.value })} placeholder="2024-2026" />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })} className="w-4 h-4" />
                  <Label>Current member</Label>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editId ? "Update" : "Add"} Member
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Portfolio</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <UserCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No executive members yet
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.portfolio}</TableCell>
                    <TableCell className="text-sm">{member.termYear}</TableCell>
                    <TableCell>
                      <Badge variant={member.isCurrent ? "default" : "secondary"}>
                        {member.isCurrent ? "Current" : "Past"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(member)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => { if (confirm("Remove this member?")) deleteMutation.mutate(member.id) }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
