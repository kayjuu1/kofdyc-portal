import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { Pencil, Plus, Trash2, UserRound } from "lucide-react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader"
import {
  createLeadershipGroup,
  createLeadershipMember,
  deleteLeadershipGroup,
  deleteLeadershipMember,
  getAllLeadership,
  updateLeadershipGroup,
  updateLeadershipMember,
} from "@/functions/leadership"
import { hasPermission, type UserRole } from "@/lib/permissions"

const MAX_PHOTO_BYTES = 3 * 1024 * 1024

async function validatePhoto(file: File): Promise<string | null> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Photo must be a JPG, PNG or WebP image"
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return "Photo must be 3 MB or smaller"
  }
  return null
}

type LeadershipData = Awaited<ReturnType<typeof getAllLeadership>>
type Group = LeadershipData[number]
type Member = Group["members"][number]

type GroupForm = {
  id: number | null
  title: string
  eyebrow: string
  intro: string
  sortOrder: number
  isPublished: boolean
}

type MemberForm = {
  id: number | null
  groupId: number
  name: string
  roleTitle: string
  photoUrl: string
  bio: string
  email: string
  phone: string
  sortOrder: number
  isPublished: boolean
}

const emptyGroupForm: GroupForm = {
  id: null,
  title: "",
  eyebrow: "",
  intro: "",
  sortOrder: 0,
  isPublished: false,
}

export const Route = createFileRoute("/_app/dashboard/leadership/")({
  beforeLoad: ({ context }) => {
    const role = ((context.session.user as { role?: string }).role ??
      "coordinator") as UserRole
    if (!hasPermission(role, "manageLeadership")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  loader: async () => getAllLeadership(),
  component: LeadershipAdminPage,
})

function LeadershipAdminPage() {
  const groups = Route.useLoaderData()
  const router = useRouter()

  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [groupForm, setGroupForm] = useState<GroupForm>(emptyGroupForm)
  const [memberDialogOpen, setMemberDialogOpen] = useState(false)
  const [memberForm, setMemberForm] = useState<MemberForm | null>(null)

  const invalidate = () => router.invalidate()

  const saveGroup = useMutation({
    mutationFn: (form: GroupForm) => {
      const payload = {
        title: form.title,
        eyebrow: form.eyebrow || null,
        intro: form.intro || null,
        sortOrder: form.sortOrder,
        isPublished: form.isPublished,
      }
      return form.id !== null
        ? updateLeadershipGroup({ data: { ...payload, id: form.id } })
        : createLeadershipGroup({ data: payload })
    },
    onSuccess: () => {
      toast.success("Group saved")
      setGroupDialogOpen(false)
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const removeGroup = useMutation({
    mutationFn: (id: number) => deleteLeadershipGroup({ data: { id } }),
    onSuccess: () => {
      toast.success("Group deleted")
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const saveMember = useMutation({
    mutationFn: (form: MemberForm) => {
      const payload = {
        groupId: form.groupId,
        name: form.name,
        roleTitle: form.roleTitle,
        photoUrl: form.photoUrl || null,
        bio: form.bio || null,
        email: form.email || null,
        phone: form.phone || null,
        sortOrder: form.sortOrder,
        isPublished: form.isPublished,
      }
      return form.id !== null
        ? updateLeadershipMember({ data: { ...payload, id: form.id } })
        : createLeadershipMember({ data: payload })
    },
    onSuccess: () => {
      toast.success("Member saved")
      setMemberDialogOpen(false)
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const removeMember = useMutation({
    mutationFn: (id: number) => deleteLeadershipMember({ data: { id } }),
    onSuccess: () => {
      toast.success("Member deleted")
      invalidate()
    },
    onError: (error: Error) => toast.error(error.message),
  })

  function openMemberForm(groupId: number, member?: Member) {
    setMemberForm({
      id: member?.id ?? null,
      groupId,
      name: member?.name ?? "",
      roleTitle: member?.roleTitle ?? "",
      photoUrl: member?.photoUrl ?? "",
      bio: member?.bio ?? "",
      email: member?.email ?? "",
      phone: member?.phone ?? "",
      sortOrder: member?.sortOrder ?? 0,
      isPublished: member?.isPublished ?? true,
    })
    setMemberDialogOpen(true)
  }

  const photoImages: UploadedImage[] = memberForm?.photoUrl
    ? [{ key: memberForm.photoUrl, url: memberForm.photoUrl, filename: "photo", size: 0 }]
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <UserRound className="size-6 text-primary" />
            Leadership
          </h1>
          <p className="text-sm text-muted-foreground">
            Groups and profiles shown on the public Leadership page.
          </p>
        </div>
        <Button
          onClick={() => {
            setGroupForm(emptyGroupForm)
            setGroupDialogOpen(true)
          }}
        >
          <Plus className="mr-1.5 size-4" />
          Add group
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No leadership groups yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => (
          <Card key={group.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{group.title.replace("|", " ")}</h2>
                  <Badge variant={group.isPublished ? "default" : "secondary"}>
                    {group.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                {group.eyebrow ? (
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {group.eyebrow}
                  </p>
                ) : null}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => openMemberForm(group.id)}>
                  <Plus className="mr-1 size-3.5" />
                  Member
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setGroupForm({
                      id: group.id,
                      title: group.title,
                      eyebrow: group.eyebrow ?? "",
                      intro: group.intro ?? "",
                      sortOrder: group.sortOrder,
                      isPublished: group.isPublished,
                    })
                    setGroupDialogOpen(true)
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => {
                    if (
                      confirm(
                        `Delete "${group.title.replace("|", " ")}" and its ${group.members.length} member(s)?`,
                      )
                    ) {
                      removeGroup.mutate(group.id)
                    }
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {group.members.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">No members yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Photo</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-20">Order</TableHead>
                      <TableHead className="w-24 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          {member.photoUrl ? (
                            <img
                              src={member.photoUrl}
                              alt=""
                              className="size-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-xs font-medium">
                              {member.name
                                .split(" ")
                                .map((part) => part[0])
                                .join("")
                                .slice(0, 2)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell className="text-sm">{member.roleTitle}</TableCell>
                        <TableCell>
                          <Badge variant={member.isPublished ? "default" : "secondary"}>
                            {member.isPublished ? "Published" : "Hidden"}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.sortOrder}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openMemberForm(group.id, member)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => {
                              if (confirm(`Delete ${member.name}?`)) {
                                removeMember.mutate(member.id)
                              }
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {/* Group dialog */}
      <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{groupForm.id !== null ? "Edit group" : "Add group"}</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              saveGroup.mutate(groupForm)
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="groupTitle">Title</Label>
              <Input
                id="groupTitle"
                required
                value={groupForm.title}
                onChange={(event) =>
                  setGroupForm((state) => ({ ...state, title: event.target.value }))
                }
                placeholder="The Diocesan|Executive Council"
              />
              <p className="text-xs text-muted-foreground">
                Text after a | renders in gold on the public page.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="groupEyebrow">Eyebrow</Label>
                <Input
                  id="groupEyebrow"
                  value={groupForm.eyebrow}
                  onChange={(event) =>
                    setGroupForm((state) => ({ ...state, eyebrow: event.target.value }))
                  }
                  placeholder="EXECUTIVES"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupSort">Sort order</Label>
                <Input
                  id="groupSort"
                  type="number"
                  value={groupForm.sortOrder}
                  onChange={(event) =>
                    setGroupForm((state) => ({
                      ...state,
                      sortOrder: Number(event.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="groupIntro">Intro paragraph</Label>
              <Textarea
                id="groupIntro"
                rows={3}
                value={groupForm.intro}
                onChange={(event) =>
                  setGroupForm((state) => ({ ...state, intro: event.target.value }))
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={groupForm.isPublished}
                onChange={(event) =>
                  setGroupForm((state) => ({ ...state, isPublished: event.target.checked }))
                }
              />
              Published (visible on the public site)
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setGroupDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveGroup.isPending}>
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Member dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {memberForm?.id != null ? "Edit member" : "Add member"}
            </DialogTitle>
          </DialogHeader>
          {memberForm ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                saveMember.mutate(memberForm)
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="memberName">Name</Label>
                  <Input
                    id="memberName"
                    required
                    value={memberForm.name}
                    onChange={(event) =>
                      setMemberForm((state) => state && { ...state, name: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memberRole">Role title</Label>
                  <Input
                    id="memberRole"
                    required
                    value={memberForm.roleTitle}
                    onChange={(event) =>
                      setMemberForm(
                        (state) => state && { ...state, roleTitle: event.target.value },
                      )
                    }
                    placeholder="Chairman"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Photo (portrait, max 3 MB)</Label>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <ImageUploader
                      images={photoImages}
                      onImagesChange={(images) =>
                        setMemberForm(
                          (state) => state && { ...state, photoUrl: images[0]?.url ?? "" },
                        )
                      }
                      coverUrl={memberForm.photoUrl || null}
                      onCoverChange={() => {}}
                      maxFiles={1}
                      validateFile={validatePhoto}
                    />
                  </div>
                  {memberForm.photoUrl ? (
                    <div className="w-28 shrink-0">
                      <p className="mb-1 text-xs text-muted-foreground">Card preview</p>
                      <img
                        src={memberForm.photoUrl}
                        alt="Card preview"
                        className="aspect-[4/5] w-full rounded-lg object-cover"
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="memberBio">Bio</Label>
                <Textarea
                  id="memberBio"
                  rows={4}
                  value={memberForm.bio}
                  onChange={(event) =>
                    setMemberForm((state) => state && { ...state, bio: event.target.value })
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="memberEmail">Email</Label>
                  <Input
                    id="memberEmail"
                    type="email"
                    value={memberForm.email}
                    onChange={(event) =>
                      setMemberForm(
                        (state) => state && { ...state, email: event.target.value },
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memberPhone">Phone</Label>
                  <Input
                    id="memberPhone"
                    value={memberForm.phone}
                    onChange={(event) =>
                      setMemberForm(
                        (state) => state && { ...state, phone: event.target.value },
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="memberSort">Sort order</Label>
                  <Input
                    id="memberSort"
                    type="number"
                    value={memberForm.sortOrder}
                    onChange={(event) =>
                      setMemberForm(
                        (state) =>
                          state && { ...state, sortOrder: Number(event.target.value) || 0 },
                      )
                    }
                  />
                </div>
                <label className="flex items-center gap-2 self-end pb-2 text-sm">
                  <input
                    type="checkbox"
                    checked={memberForm.isPublished}
                    onChange={(event) =>
                      setMemberForm(
                        (state) => state && { ...state, isPublished: event.target.checked },
                      )
                    }
                  />
                  Published
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMemberDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMember.isPending}>
                  Save
                </Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
