import { createFileRoute, Link, useRouter, redirect } from "@tanstack/react-router"
import { useState } from "react"
import {
  Check,
  ClipboardList,
  FileText,
  Loader2,
  MoreHorizontal,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  PowerOff,
  Trash2,
} from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  DashboardEmptyState,
  DashboardPageHeader,
  DashboardStatCard,
} from "@/components/dashboard-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getSubmissionPrompts,
  activateSubmissionPrompt,
  deleteSubmissionPrompt,
  setPromptSuspended,
} from "@/functions/submission-prompts"
import { hasPermission, type UserRole } from "@/lib/permissions"

interface PromptField {
  id: number
  label: string
  placeholder: string | null
  isRequired: boolean
  sortOrder: number
}

interface Prompt {
  id: number
  title: string
  isActive: boolean
  isSuspended: boolean
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  fields: PromptField[]
}

export const Route = createFileRoute("/_app/dashboard/submission-prompts/")({
  beforeLoad: ({ context }) => {
    const role = ((context.session.user as { role?: string }).role ?? "coordinator") as UserRole
    if (!hasPermission(role, "viewDashboard")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  loader: async () => {
    try {
      return await getSubmissionPrompts()
    } catch (error) {
      console.error("Failed to load prompts:", error)
      return []
    }
  },
  component: SubmissionPromptsPage,
})

function SubmissionPromptsPage() {
  const data = Route.useLoaderData()
  const router = useRouter()
  const prompts = (data || []) as Prompt[]

  const [deleteTarget, setDeleteTarget] = useState<Prompt | null>(null)

  const totalPrompts = prompts.length
  const activeFieldsCount = prompts
    .filter((p) => p.isActive)
    .reduce((sum, p) => sum + p.fields.length, 0)
  const inactiveCount = prompts.filter((p) => !p.isActive).length

  const activateMutation = useMutation({
    mutationFn: (id: number) => activateSubmissionPrompt({ data: { id } }),
    onSuccess: () => {
      toast.success("Prompt activated")
      router.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  const suspendMutation = useMutation({
    mutationFn: (vars: { id: number; suspended: boolean }) =>
      setPromptSuspended({ data: vars }),
    onSuccess: (_, vars) => {
      toast.success(vars.suspended ? "Prompt suspended" : "Prompt resumed")
      router.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSubmissionPrompt({ data: { id } }),
    onSuccess: () => {
      toast.success("Prompt deleted")
      setDeleteTarget(null)
      router.invalidate()
    },
    onError: (err) => toast.error(err.message),
  })

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Submission Prompts"
        description="Configure the fields coordinators fill when submitting programmes."
        action={{
          label: "New Prompt",
          href: "/dashboard/submission-prompts/create",
          icon: Plus,
        }}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <DashboardStatCard
          label="Total Prompts"
          value={totalPrompts}
          icon={ClipboardList}
          tone="sky"
        />
        <DashboardStatCard
          label="Active Fields"
          value={activeFieldsCount}
          icon={FileText}
          tone="emerald"
          detail="Fields in the active prompt"
        />
        <DashboardStatCard
          label="Inactive"
          value={inactiveCount}
          icon={PowerOff}
          tone="rose"
        />
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-0">
          {prompts.length === 0 ? (
            <div className="p-6">
              <DashboardEmptyState
                icon={ClipboardList}
                title="No prompts yet"
                description="Create a submission prompt to define fields coordinators fill when submitting programmes."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {prompts.map((prompt) => {
                  const isExpired =
                    !!prompt.expiresAt && new Date(prompt.expiresAt).getTime() <= Date.now()
                  return (
                  <TableRow key={prompt.id}>
                    <TableCell className="font-medium">
                      {prompt.title || `Prompt #${prompt.id}`}
                    </TableCell>
                    <TableCell className="text-sm">
                      {prompt.fields.length} {prompt.fields.length === 1 ? "field" : "fields"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={prompt.isActive ? "default" : "outline"}>
                          {prompt.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {prompt.isSuspended && (
                          <Badge variant="secondary">Suspended</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {prompt.expiresAt ? (
                        <div className="flex items-center gap-1.5">
                          <span>
                            {new Date(prompt.expiresAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          {isExpired && (
                            <Badge variant="outline" className="text-muted-foreground">
                              Expired
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(prompt.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              to="/dashboard/submission-prompts/create"
                              search={{ edit: prompt.id }}
                            >
                              <Pencil className="mr-2 size-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {!prompt.isActive && (
                            <DropdownMenuItem
                              onClick={() => activateMutation.mutate(prompt.id)}
                              disabled={activateMutation.isPending}
                            >
                              <Check className="mr-2 size-4" />
                              Activate
                            </DropdownMenuItem>
                          )}
                          {prompt.isActive && (
                            <DropdownMenuItem
                              onClick={() =>
                                suspendMutation.mutate({
                                  id: prompt.id,
                                  suspended: !prompt.isSuspended,
                                })
                              }
                              disabled={suspendMutation.isPending}
                            >
                              {prompt.isSuspended ? (
                                <>
                                  <PlayCircle className="mr-2 size-4" />
                                  Resume
                                </>
                              ) : (
                                <>
                                  <PauseCircle className="mr-2 size-4" />
                                  Suspend
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(prompt)}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Prompt</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.title || `Prompt #${deleteTarget?.id}`}&rdquo;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
