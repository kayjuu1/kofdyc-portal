import { createFileRoute, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { Search, Users } from "lucide-react"
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
import { getMembers, updateUserRole, toggleUserActive } from "@/functions/members"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

const ROLES = [
  { value: "system_admin", label: "System Admin" },
  { value: "diocesan_youth_chaplain", label: "Youth Chaplain" },
  { value: "dyc_executive", label: "DYC Executive" },
  { value: "coordinator", label: "Coordinator" },
  { value: "member", label: "Member" },
]

type SearchParams = {
  role?: string
  search?: string
  page?: number
}

export const Route = createFileRoute("/_app/dashboard/members/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    role: search.role as string | undefined,
    search: search.search as string | undefined,
    page: Number(search.page) || 1,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    return getMembers({
      data: {
        search: deps.search,
        role: deps.role,
        page: deps.page,
        limit: 20,
      },
    })
  },
  component: MembersPage,
})

function MembersPage() {
  const data = Route.useLoaderData()
  const { role, search: searchParam } = Route.useSearch()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const { session } = Route.useRouteContext()
  const isAdmin = (session.user as { role?: string }).role === "system_admin"

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

  const roleLabel = (r: string) => ROLES.find((x) => x.value === r)?.label ?? r

  const ROLE_COLORS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    system_admin: "destructive",
    diocesan_youth_chaplain: "default",
    dyc_executive: "default",
    coordinator: "secondary",
    member: "outline",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Members</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {data.total} registered members
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
                role: v === "all" ? undefined : v,
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
                {isAdmin && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                data.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-sm">{member.email}</TableCell>
                    <TableCell>
                      {isAdmin ? (
                        <Select
                          value={member.role}
                          onValueChange={(v) =>
                            roleMutation.mutate({
                              userId: member.id,
                              role: v as typeof member.role,
                            })
                          }
                        >
                          <SelectTrigger className="w-[160px] h-8">
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
                        <Badge variant={ROLE_COLORS[member.role] ?? "outline"}>
                          {roleLabel(member.role)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{member.parishName || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={member.isActive ? "default" : "secondary"}>
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            activeMutation.mutate({
                              userId: member.id,
                              isActive: !member.isActive,
                            })
                          }
                        >
                          {member.isActive ? "Deactivate" : "Activate"}
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
