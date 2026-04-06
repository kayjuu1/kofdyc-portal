import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { useState } from "react"
import { MessageSquare, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { getChaplainConversations, getChaplainStats } from "@/functions/chaplain"
import { hasPermission, type UserRole } from "@/lib/permissions"

export const Route = createFileRoute("/_app/dashboard/chaplain/")({
  beforeLoad: ({ context }) => {
    const role = ((context.session.user as { role?: string }).role ?? "coordinator") as UserRole
    if (!hasPermission(role, "manageChaplainInbox")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  loader: async () => {
    const [conversations, stats] = await Promise.all([
      getChaplainConversations({ data: {} }),
      getChaplainStats(),
    ])
    return { conversations, stats }
  },
  component: ChaplainPage,
})

function ChaplainPage() {
  const { conversations, stats } = Route.useLoaderData()
  const [filter, setFilter] = useState<"all" | "active" | "resolved">("all")

  const filtered = filter === "all"
    ? conversations
    : conversations.filter((c) => c.status === filter)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chaplain Inbox</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and reply to anonymous conversations
          </p>
        </div>
      </div>

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

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              No anonymous conversations yet
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
                      {conv.unreadCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {conv.unreadCount} unread
                        </Badge>
                      )}
                    </div>
                    {conv.latestMessagePreview && (
                      <p className="text-sm text-muted-foreground truncate mt-1">{conv.latestMessagePreview}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Updated {new Date(conv.updatedAt).toLocaleDateString()}
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
