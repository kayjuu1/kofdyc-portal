import { createFileRoute, redirect } from "@tanstack/react-router"
import { useState, useRef, useEffect } from "react"
import { Save, User, Lock, Palette, Eye, EyeOff, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getProfile, updateProfile, changePassword } from "@/functions/settings"
import { getDeaneries, getParishes } from "@/functions/locations"
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
    const [profile, deaneries, parishes] = await Promise.all([
      getProfile(),
      getDeaneries({ data: {} }),
      getParishes({ data: {} }),
    ])
    return { profile, deaneries: deaneries || [], parishes: parishes || [] }
  },
  component: SettingsPage,
})

function SettingsPage() {
  const { profile, deaneries, parishes } = Route.useLoaderData()
  const [activeTab, setActiveTab] = useState("profile")

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile" className="gap-2">
            <User className="size-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="password" className="gap-2">
            <Lock className="size-4" />
            <span>Password</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Palette className="size-4" />
            <span>Preferences</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSection
            profile={profile}
            deaneries={deaneries}
            parishes={parishes}
          />
        </TabsContent>

        <TabsContent value="password">
          <PasswordSection />
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ProfileSectionProps {
  profile: {
    id: string
    name: string
    email: string
    phone: string | null
    parishId: number | null
    deaneryId: number | null
    image: string | null
    role: string
  }
  deaneries: { id: number; name: string }[]
  parishes: { id: number; name: string; deaneryId: number | null }[]
}

function ProfileSection({ profile, deaneries, parishes }: ProfileSectionProps) {
  const [formData, setFormData] = useState<{
    name: string
    phone: string
    parishId: number | undefined
    deaneryId: number | undefined
    image: string
  }>({
    name: profile.name,
    phone: profile.phone ?? "",
    parishId: profile.parishId ?? undefined,
    deaneryId: profile.deaneryId ?? undefined,
    image: profile.image ?? "",
  })
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(profile.image ?? null)
  const fileRef = useRef<HTMLInputElement>(null)

  const updateMutation = useMutation({
    mutationFn: () =>
      updateProfile({
        data: {
          name: formData.name,
          phone: formData.phone || undefined,
          parishId: formData.parishId,
          deaneryId: formData.deaneryId,
          image: formData.image || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Profile updated successfully")
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update profile")
    },
  })

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB")
      return
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      toast.error("Image must be JPG, PNG, or WebP")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("files", file)

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = (await res.json()) as { error?: string; files: { url: string }[] }

      if (!res.ok) {
        toast.error(data.error ?? "Upload failed")
        return
      }

      const url = data.files[0]?.url
      if (url) {
        setFormData((prev) => ({ ...prev, image: url }))
        setPreview(url)
        toast.success("Image uploaded")
      }
    } catch {
      toast.error("Upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your personal details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            {preview ? (
              <img
                src={preview}
                alt="Profile"
                className="size-20 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="size-20 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                <User className="size-8 text-muted-foreground" />
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <Loader2 className="size-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Change Photo"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageSelect}
            />
            <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP — max 2MB</p>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="name">Full Name *</Label>
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
            onValueChange={(v) =>
              setFormData({
                ...formData,
                parishId: v === "none" ? undefined : parseInt(v),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select parish" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No parish selected</SelectItem>
              {parishes.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Deanery</Label>
          <Select
            value={formData.deaneryId?.toString() || "none"}
            onValueChange={(v) =>
              setFormData({
                ...formData,
                deaneryId: v === "none" ? undefined : parseInt(v),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select deanery" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No deanery selected</SelectItem>
              {deaneries.map((d) => (
                <SelectItem key={d.id} value={d.id.toString()}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            <Save className="size-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PasswordSection() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const changeMutation = useMutation({
    mutationFn: () =>
      changePassword({
        data: {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
      }),
    onSuccess: () => {
      toast.success("Password changed successfully")
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    },
    onError: (err) => {
      toast.error(err.message || "Failed to change password")
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required"
    }
    if (!formData.newPassword || formData.newPassword.length < 8) {
      newErrors.newPassword = "New password must be at least 8 characters"
    }
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    changeMutation.mutate()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
        <CardDescription>Update your account password</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Current Password *</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
                className="pr-10"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-sm text-destructive">{errors.currentPassword}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="newPassword">New Password *</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                className="pr-10"
                minLength={8}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword}</p>
            )}
            <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm New Password *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={changeMutation.isPending}>
              <Lock className="size-4 mr-2" />
              {changeMutation.isPending ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function PreferencesSection() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || "system"
    }
    return "system"
  })

  useEffect(() => {
    const root = document.documentElement
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (theme === "dark" || (theme === "system" && systemDark)) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Preferences</CardTitle>
        <CardDescription>Customize your experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2">
          <Label>Theme</Label>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label>Language</Label>
          <Select value="en" disabled>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground" title="Coming soon">
            More languages coming soon
          </p>
        </div>
      </CardContent>
    </Card>
  )
}