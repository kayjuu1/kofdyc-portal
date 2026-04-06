import { createFileRoute, Link, useRouter } from "@tanstack/react-router"
import { useState } from "react"
import { Plus, MessageSquare, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  getConversations,
  createConversation,
  getChaplainStats,
} from "@/functions/chaplain"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

export const Route = createFileRoute("/_app/dashboard/chaplain/")({
  loader: async () => {
    const conversations = await getConversations({ data: {} })
    let stats = null
    try {
      stats = await getChaplainStats()
    } catch {
      // Not chaplain role — ok
    }
    return { conversations, stats }
  },
  component: ChaplainPage,
})

function ChaplainPage() {
  const { conversations, stats } = Route.useLoaderData()
  const router = useRouter()
  const { session } = Route.useRouteContext()
  const isChaplain =
    (session.user as { role?: string }).role === "diocesan_youth_chaplain" ||
    (session.user as { role?: string }).role === "system_admin"

  const [showNew, setShowNew] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [message, setMessage] = useState("")
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all")

  const createMutation = useMutation({
    mutationFn: (data: Parameters<typeof createConversation>[0]["data"]) =>
      createConversation({ data }),
    onSuccess: (conv) => {
      toast.success("Conversation started")
      setShowNew(false)
      setMessage("")
      router.navigate({ to: "/dashboard/chaplain/$id", params: { id: String(conv.id) } })
    },
  })

  const filtered = filter === "all"
    ? conversations
    : conversations.filter((c) => c.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isChaplain ? "Chaplain Inbox" : "Chat with Chaplain"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isChaplain
              ? "Respond to member messages"
              : "Reach out to the Diocesan Youth Chaplain privately"}
          </p>
        </div>
        {!isChaplain && (
          <Button onClick={() => setShowNew(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
        )}
      </div>

      {isChaplain && stats && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{stats.totalConversations}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-primary">{stats.activeConversations}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.unreadConversations}</p>
              <p className="text-sm text-muted-foreground">Unread</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isChaplain && (
        <div className="flex gap-2">
          {(["all", "active", "resolved"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      )}

      {showNew && (
        <Card>
          <CardHeader>
            <CardTitle>New Conversation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4"
                id="anonymous"
              />
              <Label htmlFor="anonymous">Stay anonymous (chaplain won't see your name)</Label>
            </div>
            <div className="grid gap-2">
              <Label>Your message *</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your message to the chaplain..."
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => createMutation.mutate({ isAnonymous, initialMessage: message })}
                disabled={!message.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? "Sending..." : "Send Message"}
              </Button>
              <Button variant="outline" onClick={() => setShowNew(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              {isChaplain
                ? "No conversations yet"
                : "No conversations yet. Start one to reach the chaplain."}
            </CardContent>
          </Card>
        ) : (
          filtered.map((conv) => (
            <Link
              key={conv.id}
              to="/dashboard/chaplain/$id"
              params={{ id: String(conv.id) }}
              className="block"
            >
              <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{conv.displayName}</span>
                      {conv.isAnonymous && (
                        <Badge variant="secondary" className="text-xs">Anonymous</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Started {new Date(conv.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={conv.status === "active" ? "default" : "secondary"}>
                    {conv.status === "active" ? (
                      <><Clock className="w-3 h-3 mr-1" /> Active</>
                    ) : (
                      <><CheckCircle className="w-3 h-3 mr-1" /> Resolved</>
                    )}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
