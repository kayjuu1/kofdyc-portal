import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { CornerDownRight, Network, Pencil, Plus, Trash2, Users } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader"
import {
  createHierarchyLeader,
  createHierarchyNode,
  deleteHierarchyLeader,
  deleteHierarchyNode,
  getAllHierarchyNodes,
  toggleHierarchyPublish,
  updateHierarchyLeader,
  updateHierarchyNode,
} from "@/functions/hierarchy"
import { getDeaneries, getParishes } from "@/functions/locations"
import {
  HIERARCHY_CHILD_TYPE,
  HIERARCHY_TYPE_LABELS,
  slugify,
  type HierarchyNodeType,
} from "@/lib/hierarchy-rules"
import { hasPermission, type UserRole } from "@/lib/permissions"

const MAX_CREST_BYTES = 2 * 1024 * 1024

async function validateCrest(file: File): Promise<string | null> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Crest must be a JPG, PNG or WebP image"
  }
  if (file.size > MAX_CREST_BYTES) {
    return "Crest must be 2 MB or smaller"
  }
  return null
}

type NodeWithLeaders = Awaited<ReturnType<typeof getAllHierarchyNodes>>[number]
type Leader = NodeWithLeaders["leaders"][number]

type NodeForm = {
  id: number | null
  parentId: number | null
  type: HierarchyNodeType
  name: string
  slug: string
  slugTouched: boolean
  crestUrl: string
  briefHistory: string
  deaneryId: number | null
  parishId: number | null
  sortOrder: number
  isPublished: boolean
}

type LeaderForm = {
  id: number | null
  nodeId: number
  name: string
  roleTitle: string
  photoUrl: string
  phone: string
  sortOrder: number
}

export const Route = createFileRoute("/_app/dashboard/hierarchy/")({
  beforeLoad: ({ context }) => {
    const role = ((context.session.user as { role?: string }).role ??
      "coordinator") as UserRole
    if (!hasPermission(role, "manageHierarchy")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  loader: async () => {
    const [nodes, deaneries, parishes] = await Promise.all([
      getAllHierarchyNodes(),
      getDeaneries({ data: {} }),
      getParishes({ data: {} }),
    ])
    return { nodes, deaneries, parishes }
  },
  component: HierarchyAdminPage,
})

function HierarchyAdminPage() {
  const { nodes, deaneries, parishes } = Route.useLoaderData()
  const router = useRouter()

  const [nodeDialogOpen, setNodeDialogOpen] = useState(false)
  const [nodeForm, setNodeForm] = useState<NodeForm | null>(null)
  const [leadersNodeId, setLeadersNodeId] = useState<number | null>(null)
  const [leaderForm, setLeaderForm] = useState<LeaderForm | null>(null)

  const invalidate = () => router.invalidate()
  const leadersNode = nodes.find((node) => node.id === leadersNodeId) ?? null

  const saveNode = useMutation({
    mutationFn: (form: NodeForm) => {
      const payload = {
        parentId: form.parentId,
        type: form.type,
        name: form.name,
        slug: form.slug,
        crestUrl: form.crestUrl || null,
        briefHistory: form.briefHistory || null,
        deaneryId: form.deaneryId,
        parishId: form.parishId,
        sortOrder: form.sortOrder,
        isPublished: form.isPublished,
      }
      return form.id !== null
        ? updateHierarchyNode({ data: { ...payload, id: form.id } })
        : createHierarchyNode({ data: payload })
    },
    onSuccess: () => {
      toast.success("Entry saved")
      setNodeDialogOpen(false)
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const togglePublish = useMutation({
    mutationFn: (input: { id: number; isPublished: boolean }) =>
      toggleHierarchyPublish({ data: input }),
    onSuccess: (row) => {
      toast.success(row.isPublished ? "Published" : "Unpublished")
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const removeNode = useMutation({
    mutationFn: (id: number) => deleteHierarchyNode({ data: { id } }),
    onSuccess: () => {
      toast.success("Entry deleted")
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const saveLeader = useMutation({
    mutationFn: (form: LeaderForm) => {
      const payload = {
        nodeId: form.nodeId,
        name: form.name,
        roleTitle: form.roleTitle,
        photoUrl: form.photoUrl || null,
        phone: form.phone || null,
        sortOrder: form.sortOrder,
      }
      return form.id !== null
        ? updateHierarchyLeader({ data: { ...payload, id: form.id } })
        : createHierarchyLeader({ data: payload })
    },
    onSuccess: () => {
      toast.success("Leader saved")
      setLeaderForm(null)
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const removeLeader = useMutation({
    mutationFn: (id: number) => deleteHierarchyLeader({ data: { id } }),
    onSuccess: () => {
      toast.success("Leader removed")
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function openCreate(type: HierarchyNodeType, parentId: number | null) {
    setNodeForm({
      id: null,
      parentId,
      type,
      name: "",
      slug: "",
      slugTouched: false,
      crestUrl: "",
      briefHistory: "",
      deaneryId: null,
      parishId: null,
      sortOrder: 0,
      isPublished: false,
    })
    setNodeDialogOpen(true)
  }

  function openEdit(node: NodeWithLeaders) {
    setNodeForm({
      id: node.id,
      parentId: node.parentId,
      type: node.type,
      name: node.name,
      slug: node.slug,
      slugTouched: true,
      crestUrl: node.crestUrl ?? "",
      briefHistory: node.briefHistory ?? "",
      deaneryId: node.deaneryId,
      parishId: node.parishId,
      sortOrder: node.sortOrder,
      isPublished: node.isPublished,
    })
    setNodeDialogOpen(true)
  }

  function NodeRow({ node, depth }: { node: NodeWithLeaders; depth: number }) {
    const childType = HIERARCHY_CHILD_TYPE[node.type]
    const childCount = nodes.filter((candidate) => candidate.parentId === node.id).length
    return (
      <div
        className="flex items-center gap-3 border-b py-2.5 last:border-b-0"
        style={{ paddingLeft: depth * 28 }}
      >
        {depth > 0 ? (
          <CornerDownRight className="size-4 shrink-0 text-muted-foreground" />
        ) : null}
        {node.crestUrl ? (
          <img src={node.crestUrl} alt="" className="size-8 rounded-full object-cover" />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{node.name}</p>
          <p className="text-xs text-muted-foreground">
            {HIERARCHY_TYPE_LABELS[node.type]} · /{node.slug}
          </p>
        </div>
        <Badge variant="outline" className="hidden sm:inline-flex">
          {node.leaders.length} leader{node.leaders.length === 1 ? "" : "s"}
        </Badge>
        <div className="flex items-center gap-1.5">
          <Switch
            checked={node.isPublished}
            onCheckedChange={(checked) =>
              togglePublish.mutate({ id: node.id, isPublished: checked })
            }
            aria-label={`Publish ${node.name}`}
          />
          {childType ? (
            <Button
              size="sm"
              variant="outline"
              className="hidden md:inline-flex"
              onClick={() => openCreate(childType, node.id)}
            >
              <Plus className="mr-1 size-3.5" />
              {HIERARCHY_TYPE_LABELS[childType]}
            </Button>
          ) : null}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setLeadersNodeId(node.id)}
            aria-label="Manage leaders"
          >
            <Users className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => openEdit(node)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive"
            onClick={() => {
              if (childCount > 0) {
                toast.error("Delete or move this entry's children first")
                return
              }
              if (confirm(`Delete "${node.name}"?`)) {
                removeNode.mutate(node.id)
              }
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    )
  }

  function renderTree(roots: NodeWithLeaders[]) {
    return roots.map((root) => (
      <div key={root.id}>
        <NodeRow node={root} depth={0} />
        {nodes
          .filter((candidate) => candidate.parentId === root.id)
          .map((child) => (
            <NodeRow key={child.id} node={child} depth={1} />
          ))}
      </div>
    ))
  }

  const movements = nodes.filter((node) => node.type === "movement")
  const councils = nodes.filter((node) => node.type === "deanery_council")

  const crestImages: UploadedImage[] = nodeForm?.crestUrl
    ? [{ key: nodeForm.crestUrl, url: nodeForm.crestUrl, filename: "crest", size: 0 }]
    : []
  const leaderPhotoImages: UploadedImage[] = leaderForm?.photoUrl
    ? [{ key: leaderForm.photoUrl, url: leaderForm.photoUrl, filename: "photo", size: 0 }]
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Network className="size-6 text-primary" />
            Hierarchy
          </h1>
          <p className="text-sm text-muted-foreground">
            Movements, societies and youth councils shown on the public Hierarchy page.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <h2 className="text-lg font-semibold">Movements &amp; Societies</h2>
          <Button size="sm" onClick={() => openCreate("movement", null)}>
            <Plus className="mr-1 size-3.5" />
            Add movement
          </Button>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No movements yet.</p>
          ) : (
            renderTree(movements)
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <h2 className="text-lg font-semibold">Councils</h2>
          <Button size="sm" onClick={() => openCreate("deanery_council", null)}>
            <Plus className="mr-1 size-3.5" />
            Add deanery council
          </Button>
        </CardHeader>
        <CardContent>
          {councils.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No councils yet.</p>
          ) : (
            renderTree(councils)
          )}
        </CardContent>
      </Card>

      {/* Node dialog */}
      <Dialog open={nodeDialogOpen} onOpenChange={setNodeDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {nodeForm?.id != null
                ? `Edit ${nodeForm ? HIERARCHY_TYPE_LABELS[nodeForm.type] : ""}`
                : `Add ${nodeForm ? HIERARCHY_TYPE_LABELS[nodeForm.type] : ""}`}
            </DialogTitle>
          </DialogHeader>
          {nodeForm ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                saveNode.mutate(nodeForm)
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  {/*
                    id must not be "nodeName": HTMLFormElement's named getter is
                    [LegacyOverrideBuiltIns], so a control with that id shadows
                    form.nodeName with the input element. React's submit handling
                    calls node.nodeName.toLowerCase() and throws before our
                    preventDefault() runs, so the browser does a native GET submit
                    and the entry is silently never saved.
                  */}
                  <Label htmlFor="hierarchyNodeName">Name</Label>
                  <Input
                    id="hierarchyNodeName"
                    required
                    value={nodeForm.name}
                    onChange={(event) =>
                      setNodeForm(
                        (state) =>
                          state && {
                            ...state,
                            name: event.target.value,
                            slug: state.slugTouched ? state.slug : slugify(event.target.value),
                          },
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nodeSlug">Slug</Label>
                  <Input
                    id="nodeSlug"
                    required
                    value={nodeForm.slug}
                    onChange={(event) =>
                      setNodeForm(
                        (state) =>
                          state && {
                            ...state,
                            slug: event.target.value,
                            slugTouched: true,
                          },
                      )
                    }
                  />
                </div>
              </div>

              {nodeForm.type === "deanery_council" ? (
                <div className="space-y-2">
                  <Label>Deanery</Label>
                  <Select
                    value={nodeForm.deaneryId !== null ? String(nodeForm.deaneryId) : ""}
                    onValueChange={(value) =>
                      setNodeForm((state) => state && { ...state, deaneryId: Number(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select the deanery" />
                    </SelectTrigger>
                    <SelectContent>
                      {deaneries.map((deanery) => (
                        <SelectItem key={deanery.id} value={String(deanery.id)}>
                          {deanery.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              {nodeForm.type === "parish_council" ? (
                <div className="space-y-2">
                  <Label>Parish</Label>
                  <Select
                    value={nodeForm.parishId !== null ? String(nodeForm.parishId) : ""}
                    onValueChange={(value) =>
                      setNodeForm((state) => state && { ...state, parishId: Number(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select the parish" />
                    </SelectTrigger>
                    <SelectContent>
                      {parishes.map((parish) => (
                        <SelectItem key={parish.id} value={String(parish.id)}>
                          {parish.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Crest / logo (optional, max 2 MB)</Label>
                <ImageUploader
                  images={crestImages}
                  onImagesChange={(images) =>
                    setNodeForm((state) => state && { ...state, crestUrl: images[0]?.url ?? "" })
                  }
                  coverUrl={nodeForm.crestUrl || null}
                  onCoverChange={() => {}}
                  maxFiles={1}
                  validateFile={validateCrest}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nodeHistory">Brief history</Label>
                <Textarea
                  id="nodeHistory"
                  rows={6}
                  value={nodeForm.briefHistory}
                  onChange={(event) =>
                    setNodeForm(
                      (state) => state && { ...state, briefHistory: event.target.value },
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Markdown supported: **bold**, *italic*, lists, ### headings, links.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nodeSort">Sort order</Label>
                  <Input
                    id="nodeSort"
                    type="number"
                    value={nodeForm.sortOrder}
                    onChange={(event) =>
                      setNodeForm(
                        (state) =>
                          state && { ...state, sortOrder: Number(event.target.value) || 0 },
                      )
                    }
                  />
                </div>
                <label className="flex items-center gap-2 self-end pb-2 text-sm">
                  <Switch
                    checked={nodeForm.isPublished}
                    onCheckedChange={(checked) =>
                      setNodeForm((state) => state && { ...state, isPublished: checked })
                    }
                  />
                  Published
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setNodeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveNode.isPending}>
                  Save
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Leaders sheet */}
      <Sheet
        open={leadersNodeId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setLeadersNodeId(null)
            setLeaderForm(null)
          }
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Leaders — {leadersNode?.name}</SheetTitle>
          </SheetHeader>
          {leadersNode ? (
            <div className="space-y-4 px-4 pb-6">
              {leadersNode.leaders.length === 0 && !leaderForm ? (
                <p className="text-sm text-muted-foreground">No leaders added yet.</p>
              ) : null}

              {leadersNode.leaders.map((leader: Leader) => (
                <div
                  key={leader.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  {leader.photoUrl ? (
                    <img
                      src={leader.photoUrl}
                      alt=""
                      className="size-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {leader.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{leader.name}</p>
                    <p className="text-xs text-muted-foreground">{leader.roleTitle}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      setLeaderForm({
                        id: leader.id,
                        nodeId: leadersNode.id,
                        name: leader.name,
                        roleTitle: leader.roleTitle,
                        photoUrl: leader.photoUrl ?? "",
                        phone: leader.phone ?? "",
                        sortOrder: leader.sortOrder,
                      })
                    }
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm(`Remove ${leader.name}?`)) {
                        removeLeader.mutate(leader.id)
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}

              {leaderForm ? (
                <form
                  className="space-y-3 rounded-lg border p-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    saveLeader.mutate(leaderForm)
                  }}
                >
                  <p className="text-sm font-semibold">
                    {leaderForm.id !== null ? "Edit leader" : "Add leader"}
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="leaderName">Name</Label>
                    <Input
                      id="leaderName"
                      required
                      value={leaderForm.name}
                      onChange={(event) =>
                        setLeaderForm(
                          (state) => state && { ...state, name: event.target.value },
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leaderRole">Role title</Label>
                    <Input
                      id="leaderRole"
                      required
                      value={leaderForm.roleTitle}
                      onChange={(event) =>
                        setLeaderForm(
                          (state) => state && { ...state, roleTitle: event.target.value },
                        )
                      }
                      placeholder="President"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leaderPhone">Phone (optional)</Label>
                    <Input
                      id="leaderPhone"
                      value={leaderForm.phone}
                      onChange={(event) =>
                        setLeaderForm(
                          (state) => state && { ...state, phone: event.target.value },
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Photo (optional, max 3 MB)</Label>
                    <ImageUploader
                      images={leaderPhotoImages}
                      onImagesChange={(images) =>
                        setLeaderForm(
                          (state) => state && { ...state, photoUrl: images[0]?.url ?? "" },
                        )
                      }
                      coverUrl={leaderForm.photoUrl || null}
                      onCoverChange={() => {}}
                      maxFiles={1}
                      validateFile={async (file) => {
                        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
                          return "Photo must be a JPG, PNG or WebP image"
                        }
                        if (file.size > 3 * 1024 * 1024) {
                          return "Photo must be 3 MB or smaller"
                        }
                        return null
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leaderSort">Sort order</Label>
                    <Input
                      id="leaderSort"
                      type="number"
                      value={leaderForm.sortOrder}
                      onChange={(event) =>
                        setLeaderForm(
                          (state) =>
                            state && { ...state, sortOrder: Number(event.target.value) || 0 },
                        )
                      }
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setLeaderForm(null)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saveLeader.isPending}>
                      Save leader
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    setLeaderForm({
                      id: null,
                      nodeId: leadersNode.id,
                      name: "",
                      roleTitle: "",
                      photoUrl: "",
                      phone: "",
                      sortOrder: leadersNode.leaders.length,
                    })
                  }
                >
                  <Plus className="mr-1.5 size-4" />
                  Add leader
                </Button>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
