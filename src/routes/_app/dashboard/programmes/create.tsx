import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router"
import { useState } from "react"
import { ArrowLeft, Plus, Trash2, Save, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createProgramme, submitProgramme } from "@/functions/programmes"
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

export const Route = createFileRoute("/_app/dashboard/programmes/create")({
  beforeLoad: ({ context }) => {
    const role = canonicalizeRole((context.session.user as { role?: string }).role)
    if (role !== "coordinator") {
      throw redirect({ to: "/dashboard/programmes" })
    }
  },
  loader: async () => {
    const parishes = await getParishes({ data: {} })
    return { parishes }
  },
  component: CreateProgrammePage,
})

function CreateProgrammePage() {
  const { parishes } = Route.useLoaderData()
  const navigate = useNavigate()

  const [parishId, setParishId] = useState("")
  const [year, setYear] = useState(currentYear.toString())
  const [activities, setActivities] = useState<Activity[]>([
    { title: "", description: "", date: "", responsiblePerson: "" },
  ])

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
