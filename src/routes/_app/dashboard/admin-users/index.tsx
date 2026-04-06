import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { Search, Shield } from "lucide-react"
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
import { getAdminUsers, updateUserRole, toggleUserActive } from "@/functions/members"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  getRoleLabel,
  hasPermission,
  ROLE_LABELS,
  type UserRole,
} from "@/lib/permissions"

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

  const roleMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateUserRole>[0]["data"]) =>
      updateUserRole({ data }),
    onSuccess: () => {
      toast.success("Role updated")
      router.invalidate()
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Users</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data.total} admin accounts
        </p>
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
          <SelectTrigger className="w-[180px]">
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
                          <SelectTrigger className="w-[180px] h-8">
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
