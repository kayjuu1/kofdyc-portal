import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { Search, Shield, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { getAdminUsers, updateUserRole, toggleUserActive, createUser } from "@/functions/members"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getRoleLabel,
  hasPermission,
  ROLE_LABELS,
  type UserRole,
} from "@/lib/permissions"

function generateTempPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  let password = ""
  for (let i = 0; i < 10; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  return password
}

const ROLES = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label })) as Array<{
  value: UserRole
  label: string
}>

type SearchParams = {
  role?: UserRole
  search?: string
  page?: number
}

export const Route = createFileRoute("/_app/dashboard/admin-users/")({
  beforeLoad: ({ context }) => {
    const role = ((context.session.user as { role?: string }).role ?? "coordinator") as UserRole
    if (!hasPermission(role, "manageAdminUsers")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    role: search.role as UserRole | undefined,
    search: search.search as string | undefined,
    page: Number(search.page) || 1,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    return getAdminUsers({
      data: {
        search: deps.search,
        role: deps.role,
        page: deps.page,
        limit: 20,
      },
    })
  },
  component: AdminUsersPage,
})

function AdminUsersPage() {
  const data = Route.useLoaderData()
  const { role, search: searchParam } = Route.useSearch()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const { session } = Route.useRouteContext()
  const canManageAdminUsers = hasPermission(
    ((session.user as { role?: string }).role ?? "coordinator") as UserRole,
    "manageAdminUsers",
  )

  const [searchInput, setSearchInput] = useState(searchParam ?? "")
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: generateTempPassword(),
    role: "coordinator" as UserRole,
    phone: "",
  })

  const roleMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateUserRole>[0]["data"]) =>
      updateUserRole({ data }),
    onSuccess: () => {
      toast.success("Role updated")
      router.invalidate()
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof createUser>[0]["data"]) =>
      createUser({ data }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("User created successfully")
        setAddUserOpen(false)
        setNewUser({ name: "", email: "", password: generateTempPassword(), role: "coordinator", phone: "" })
        router.invalidate()
      } else {
        toast.error(result.error ?? "Failed to create user")
      }
    },
    onError: () => {
      toast.error("Failed to create user")
    },
  })

  const activeMutation = useMutation({
    mutationFn: (data: Parameters<typeof toggleUserActive>[0]["data"]) =>
      toggleUserActive({ data }),
    onSuccess: () => {
      toast.success("Status updated")
      router.invalidate()
    },
  })

  const handleSearch = () => {
    navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        search: searchInput || undefined,
        page: undefined,
      }),
    })
  }

  const ROLE_COLORS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    system_admin: "destructive",
    youth_chaplain: "default",
    diocesan_executive: "default",
    coordinator: "secondary",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Users</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data.total} admin accounts
          </p>
        </div>
        {canManageAdminUsers && (
          <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  createMutation.mutate({
                    name: newUser.name,
                    email: newUser.email,
                    password: newUser.password,
                    role: newUser.role,
                    ...(newUser.phone ? { phone: newUser.phone } : {}),
                  })
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Temporary Password</Label>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      required
                      minLength={6}
                      value={newUser.password}
                      onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewUser((p) => ({ ...p, password: generateTempPassword() }))}
                    >
                      Generate
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(v) => setNewUser((p) => ({ ...p, role: v as UserRole }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    value={newUser.phone}
                    onChange={(e) => setNewUser((p) => ({ ...p, phone: e.target.value }))}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9"
          />
        </div>
        <Select
          value={role ?? "all"}
          onValueChange={(v) =>
            navigate({
              search: (prev: Record<string, unknown>) => ({
                ...prev,
                role: v === "all" ? undefined : (v as UserRole),
                page: undefined,
              }),
            })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {ROLES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Parish</TableHead>
                <TableHead>Status</TableHead>
                {canManageAdminUsers && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.adminUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canManageAdminUsers ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No admin users found
                  </TableCell>
                </TableRow>
              ) : (
                data.adminUsers.map((adminUser) => (
                  <TableRow key={adminUser.id}>
                    <TableCell className="font-medium">{adminUser.name}</TableCell>
                    <TableCell className="text-sm">{adminUser.email}</TableCell>
                    <TableCell>
                      {canManageAdminUsers ? (
                        <Select
                          value={adminUser.role}
                          onValueChange={(v) =>
                            roleMutation.mutate({
                              userId: adminUser.id,
                              role: v as UserRole,
                            })
                          }
                        >
                          <SelectTrigger className="w-full sm:w-[180px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={ROLE_COLORS[adminUser.role] ?? "outline"}>
                          {getRoleLabel(adminUser.role)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{adminUser.parishName || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={adminUser.isActive ? "default" : "secondary"}>
                        {adminUser.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {canManageAdminUsers && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            activeMutation.mutate({
                              userId: adminUser.id,
                              isActive: !adminUser.isActive,
                            })
                          }
                        >
                          {adminUser.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === data.page ? "default" : "outline"}
              size="sm"
              onClick={() =>
                navigate({
                  search: (prev: Record<string, unknown>) => ({ ...prev, page: p }),
                })
              }
            >
              {p}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}
