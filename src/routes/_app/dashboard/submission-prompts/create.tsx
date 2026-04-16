import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router"
import { useState } from "react"
import { ArrowLeft, Loader2, Plus, Save, Trash2, Zap } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createSubmissionPrompt,
  updateSubmissionPrompt,
  getSubmissionPromptById,
} from "@/functions/submission-prompts"
import { hasPermission, type UserRole } from "@/lib/permissions"

type SearchParams = {
  edit?: number
}

type FieldType = 'text' | 'image' | 'pdf'

interface PromptField {
  id?: number
  label: string
  placeholder: string
  isRequired: boolean
  fieldType: FieldType
}

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Text",
  image: "Image",
  pdf: "PDF",
}

export const Route = createFileRoute("/_app/dashboard/submission-prompts/create")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    edit: search.edit ? Number(search.edit) : undefined,
  }),
  beforeLoad: ({ context }) => {
    const role = ((context.session.user as { role?: string }).role ?? "coordinator") as UserRole
    if (!hasPermission(role, "viewDashboard")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  loaderDeps: ({ search }) => ({ edit: search.edit }),
  loader: async ({ deps }) => {
    if (deps.edit) {
      const prompt = await getSubmissionPromptById({ data: { id: deps.edit } })
      return { prompt }
    }
    return { prompt: null }
  },
  component: CreateSubmissionPromptPage,
})

function CreateSubmissionPromptPage() {
  const { prompt } = Route.useLoaderData()
  const { edit } = Route.useSearch()
  const navigate = useNavigate()
  const isEditing = !!edit && !!prompt

  const [title, setTitle] = useState(prompt?.title ?? "")
  const [fields, setFields] = useState<PromptField[]>(
    prompt?.fields?.map((f) => ({
      id: f.id,
      label: f.label,
      placeholder: f.placeholder ?? "",
      isRequired: f.isRequired,
      fieldType: (f.fieldType as FieldType) ?? "text",
    })) ?? []
  )
  const [newFieldLabel, setNewFieldLabel] = useState("")
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState("")
  const [newFieldType, setNewFieldType] = useState<FieldType>("text")

  const createMutation = useMutation({
    mutationFn: (activate: boolean) =>
      createSubmissionPrompt({
        data: {
          title,
          fields: fields.filter((f) => f.label.trim()),
          activate,
        },
      }),
    onSuccess: (_, activate) => {
      toast.success(activate ? "Prompt created and activated" : "Prompt created")
      navigate({ to: "/dashboard/submission-prompts" })
    },
    onError: (err) => toast.error(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: (activate: boolean) =>
      updateSubmissionPrompt({
        data: {
          id: edit!,
          title,
          fields: fields.filter((f) => f.label.trim()),
          activate,
        },
      }),
    onSuccess: (_, activate) => {
      toast.success(activate ? "Prompt saved and activated" : "Prompt saved")
      navigate({ to: "/dashboard/submission-prompts" })
    },
    onError: (err) => toast.error(err.message),
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSave = (activate: boolean) => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    if (fields.filter((f) => f.label.trim()).length === 0) {
      toast.error("Add at least one field")
      return
    }
    if (isEditing) {
      updateMutation.mutate(activate)
    } else {
      createMutation.mutate(activate)
    }
  }

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return
    setFields([
      ...fields,
      { label: newFieldLabel, placeholder: newFieldPlaceholder, isRequired: false, fieldType: newFieldType },
    ])
    setNewFieldLabel("")
    setNewFieldPlaceholder("")
    setNewFieldType("text")
  }

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleToggleRequired = (index: number) => {
    setFields(
      fields.map((f, i) =>
        i === index ? { ...f, isRequired: !f.isRequired } : f
      )
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/submission-prompts">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? "Edit Prompt" : "New Prompt"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEditing
              ? "Update the fields for this submission prompt."
              : "Define what coordinators fill when submitting programmes."}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Prompt Details</CardTitle>
          <CardDescription>
            Give this prompt a title and add the fields coordinators will fill.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 2026 Programme Submission Template"
            />
          </div>

          {/* Existing fields */}
          {fields.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fields</Label>
              {fields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{field.label}</p>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {FIELD_TYPE_LABELS[field.fieldType]}
                      </Badge>
                    </div>
                    {field.placeholder && (
                      <p className="text-xs text-muted-foreground truncate">
                        {field.placeholder}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={field.isRequired}
                        onChange={() => handleToggleRequired(index)}
                        className="size-3.5 rounded border-border"
                      />
                      Required
                    </label>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveField(index)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add field */}
          <div className="rounded-lg border border-dashed p-4 space-y-3">
            <Label className="text-sm font-medium">Add Field</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              <Input
                placeholder="Label (e.g. Theme for the Year)"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddField()}
              />
              <Input
                placeholder="Placeholder / hint text"
                value={newFieldPlaceholder}
                onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddField()}
              />
              <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as FieldType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={handleAddField}>
              <Plus className="size-4 mr-1.5" />
              Add Field
            </Button>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isPending}
            >
              {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
              <Save className="size-4 mr-1.5" />
              Save
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={isPending}
            >
              {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
              <Zap className="size-4 mr-1.5" />
              Save &amp; Activate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
