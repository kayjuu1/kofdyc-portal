import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router"
import { useState, useRef } from "react"
import { ArrowLeft, Plus, Trash2, Save, Send, Upload, Loader2, FileText, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createProgramme, submitProgramme } from "@/functions/programmes"
import { getActiveSubmissionPrompt, saveProgrammeResponses } from "@/functions/submission-prompts"
import { getParishes } from "@/functions/locations"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { canonicalizeRole } from "@/lib/permissions"

const currentYear = new Date().getFullYear()
const YEARS = [currentYear, currentYear + 1]

interface Activity {
  title: string
  description: string
  date: string
  responsiblePerson: string
}

interface PromptField {
  id: number
  label: string
  placeholder: string
  isRequired: boolean
  fieldType: string
}

export const Route = createFileRoute("/_app/dashboard/programmes/create")({
  beforeLoad: ({ context }) => {
    const role = canonicalizeRole((context.session.user as { role?: string }).role)
    if (role !== "coordinator") {
      throw redirect({ to: "/dashboard/programmes" })
    }
  },
  loader: async () => {
    const [parishes, prompt] = await Promise.all([
      getParishes({ data: {} }),
      getActiveSubmissionPrompt(),
    ])
    return { parishes, prompt }
  },
  component: CreateProgrammePage,
})

function FileUploadField({
  accept,
  label,
  value,
  onChange,
  placeholder,
  fileTypeLabel,
}: {
  accept: string
  label: string
  value: string
  onChange: (url: string) => void
  placeholder?: string
  fileTypeLabel: string
}) {
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("files", file)
      formData.append("category", "programmes")
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = (await res.json()) as { error?: string; files: { url: string; filename: string }[] }
      if (!res.ok) {
        toast.error(data.error ?? "Upload failed")
        return
      }
      if (data.files.length > 0) {
        onChange(data.files[0].url)
        setFileName(data.files[0].filename)
      }
    } catch {
      toast.error("Upload failed")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {value ? (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          {accept.startsWith("image") ? (
            <img src={value} alt={label} className="w-16 h-16 rounded object-cover" />
          ) : (
            <FileText className="w-10 h-10 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{fileName || value}</p>
            <p className="text-xs text-muted-foreground">{fileTypeLabel} uploaded</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => { onChange(""); setFileName("") }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-muted-foreground/50 hover:bg-muted/50 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Upload className="w-6 h-6" />
              <span className="text-sm">{placeholder || `Upload ${fileTypeLabel}`}</span>
              <span className="text-xs">
                {accept.startsWith("image") ? "JPEG, PNG, WebP, GIF" : "PDF files"} — max 20MB
              </span>
            </div>
          )}
        </button>
      )}
    </div>
  )
}

function CreateProgrammePage() {
  const data = Route.useLoaderData()
  const navigate = useNavigate()
  const { parishes, prompt } = data as { parishes: { id: number; name: string }[]; prompt: { id: number; fields: PromptField[] } | null }

  const [parishId, setParishId] = useState("")
  const [year, setYear] = useState(currentYear.toString())
  const [activities, setActivities] = useState<Activity[]>([
    { title: "", description: "", date: "", responsiblePerson: "" },
  ])
  const [promptResponses, setPromptResponses] = useState<Record<number, string>>({})

  const addActivity = () => {
    setActivities([...activities, { title: "", description: "", date: "", responsiblePerson: "" }])
  }

  const removeActivity = (index: number) => {
    setActivities(activities.filter((_, i) => i !== index))
  }

  const updateActivity = (index: number, field: keyof Activity, value: string) => {
    const updated = [...activities]
    updated[index] = { ...updated[index], [field]: value }
    setActivities(updated)
  }

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof createProgramme>[0]["data"]) =>
      createProgramme({ data }),
  })

  const submitMutation = useMutation({
    mutationFn: (id: number) => submitProgramme({ data: { id } }),
    onSuccess: () => {
      toast.success("Programme submitted for review")
      navigate({ to: "/dashboard/programmes" })
    },
  })

  const handleSave = async (andSubmit: boolean) => {
    if (!parishId) {
      toast.error("Please select a parish")
      return
    }
    const validActivities = activities.filter((a) => a.title && a.date)
    if (validActivities.length === 0) {
      toast.error("Add at least one activity")
      return
    }

    // Validate required prompt fields
    if (prompt && prompt.fields) {
      const missingRequired = prompt.fields
        .filter((f) => f.isRequired && !promptResponses[f.id]?.trim())
        .map((f) => f.label)
      if (missingRequired.length > 0) {
        toast.error(`Please fill in: ${missingRequired.join(", ")}`)
        return
      }
    }

    try {
      const programme = await createMutation.mutateAsync({
        parishId: parseInt(parishId),
        year: parseInt(year),
        activities: validActivities.map((a) => ({
          title: a.title,
          description: a.description || undefined,
          date: a.date,
          responsiblePerson: a.responsiblePerson || undefined,
        })),
      })

      // Save prompt responses if prompt exists
      if (prompt && prompt.fields && prompt.fields.length > 0 && Object.keys(promptResponses).length > 0) {
        const responses = prompt.fields
          .filter((f) => promptResponses[f.id]?.trim())
          .map((f) => ({
            fieldId: f.id,
            value: promptResponses[f.id].trim(),
          }))

        if (responses.length > 0) {
          await saveProgrammeResponses({ data: { programmeId: programme.id, responses } })
        }
      }

      if (andSubmit) {
        submitMutation.mutate(programme.id)
      } else {
        toast.success("Programme saved as draft")
        navigate({ to: "/dashboard/programmes" })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create programme")
    }
  }

  const isPending = createMutation.isPending || submitMutation.isPending

  function renderFieldInput(field: PromptField) {
    const fieldType = field.fieldType || "text"

    if (fieldType === "image") {
      return (
        <FileUploadField
          accept="image/jpeg,image/png,image/webp,image/gif"
          label={field.label}
          value={promptResponses[field.id] || ""}
          onChange={(url) => setPromptResponses({ ...promptResponses, [field.id]: url })}
          placeholder={field.placeholder || `Upload image for ${field.label.toLowerCase()}`}
          fileTypeLabel="Image"
        />
      )
    }

    if (fieldType === "pdf") {
      return (
        <FileUploadField
          accept="application/pdf"
          label={field.label}
          value={promptResponses[field.id] || ""}
          onChange={(url) => setPromptResponses({ ...promptResponses, [field.id]: url })}
          placeholder={field.placeholder || `Upload PDF for ${field.label.toLowerCase()}`}
          fileTypeLabel="PDF"
        />
      )
    }

    return (
      <Textarea
        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
        value={promptResponses[field.id] || ""}
        onChange={(e) =>
          setPromptResponses({ ...promptResponses, [field.id]: e.target.value })
        }
        rows={3}
        required={field.isRequired}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/programmes">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Pastoral Programme</h1>
          <p className="text-sm text-muted-foreground">Submit your parish&apos;s annual programme</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Programme Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Parish *</Label>
              <Select value={parishId} onValueChange={setParishId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parish" />
                </SelectTrigger>
                <SelectContent>
                  {parishes.map((p: { id: number; name: string }) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Year *</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prompt Fields - only show if active prompt exists */}
      {prompt && prompt.fields && prompt.fields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Programme Information</CardTitle>
            <CardDescription>
              Please fill in the following details for your programme submission
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {prompt.fields.map((field) => (
              <div key={field.id} className="grid gap-2">
                <Label>
                  {field.label}
                  {field.isRequired && <span className="text-destructive ml-1">*</span>}
                </Label>
                {renderFieldInput(field)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activities</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addActivity}>
              <Plus className="w-4 h-4 mr-1" />
              Add Activity
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="p-4 rounded-md border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Activity {index + 1}
                </span>
                {activities.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => removeActivity(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Title *</Label>
                  <Input
                    value={activity.title}
                    onChange={(e) => updateActivity(index, "title", e.target.value)}
                    placeholder="Activity title"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={activity.date}
                    onChange={(e) => updateActivity(index, "date", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label>Description</Label>
                <Textarea
                  value={activity.description}
                  onChange={(e) => updateActivity(index, "description", e.target.value)}
                  placeholder="Brief description..."
                  rows={2}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Responsible Person</Label>
                <Input
                  value={activity.responsiblePerson}
                  onChange={(e) => updateActivity(index, "responsiblePerson", e.target.value)}
                  placeholder="Name of responsible person"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => navigate({ to: "/dashboard/programmes" })}
        >
          Cancel
        </Button>
        <Button
          variant="outline"
          disabled={isPending}
          onClick={() => handleSave(false)}
        >
          <Save className="w-4 h-4 mr-2" />
          {isPending ? "Saving..." : "Save as Draft"}
        </Button>
        <Button disabled={isPending} onClick={() => handleSave(true)}>
          <Send className="w-4 h-4 mr-2" />
          {isPending ? "Submitting..." : "Save & Submit"}
        </Button>
      </div>
    </div>
  )
}
