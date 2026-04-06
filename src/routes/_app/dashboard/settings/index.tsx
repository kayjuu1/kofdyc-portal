import { createFileRoute, redirect } from "@tanstack/react-router"
import { useState } from "react"
import { Save } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getProfile, updateProfile } from "@/functions/settings"
import { getParishes } from "@/functions/locations"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { hasPermission, getRoleLabel, type UserRole } from "@/lib/permissions"

export const Route = createFileRoute("/_app/dashboard/settings/")({
  beforeLoad: ({ context }) => {
    const role = ((context.session.user as { role?: string }).role ?? "coordinator") as UserRole
    if (!hasPermission(role, "manageSettings")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  loader: async () => {
    const [profile, parishes] = await Promise.all([
      getProfile(),
      getParishes({ data: {} }),
    ])
    return { profile, parishes }
  },
  component: SettingsPage,
})

function SettingsPage() {
  const { profile, parishes: parishesList } = Route.useLoaderData()
  const parishes = parishesList || []

  const [formData, setFormData] = useState({
    name: profile.name,
    phone: profile.phone ?? "",
    parishId: profile.parishId ?? undefined as number | undefined,
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateProfile({
        data: {
          name: formData.name,
          phone: formData.phone || undefined,
          parishId: formData.parishId,
        },
      }),
    onSuccess: () => {
      toast.success("Profile updated")
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update profile")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                minLength={2}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile.email} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={getRoleLabel(profile.role)} disabled className="bg-muted" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+233..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Parish</Label>
              <Select
                value={formData.parishId?.toString() || "none"}
                onValueChange={(v) => setFormData({ ...formData, parishId: v === "none" ? undefined : parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parish" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parish selected</SelectItem>
                  {parishes.map((p: { id: number; name: string; deaneryId: number | null }) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={updateMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
