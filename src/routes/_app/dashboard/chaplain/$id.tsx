import { createFileRoute, Link } from "@tanstack/react-router"
import { useState, useEffect, useRef } from "react"
import { ArrowLeft, Send, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import {
  getMessages,
  sendMessage,
  updateConversationStatus,
} from "@/functions/chaplain"
import { useMutation, useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

export const Route = createFileRoute("/_app/dashboard/chaplain/$id")({
  loader: async ({ params }) => {
    return getMessages({ data: { conversationId: parseInt(params.id) } })
  },
  component: ChatPage,
})

function ChatPage() {
  const initialData = Route.useLoaderData()
  const { id } = Route.useParams()
  const { session } = Route.useRouteContext()
  const isChaplain =
    (session.user as { role?: string }).role === "diocesan_youth_chaplain" ||
    (session.user as { role?: string }).role === "system_admin"

  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Poll for new messages every 5 seconds
  const { data } = useQuery({
    queryKey: ["chaplain-messages", id],
    queryFn: () => getMessages({ data: { conversationId: parseInt(id) } }),
    initialData,
    refetchInterval: 5000,
  })

  const messages = data.messages
  const conversation = data.conversation

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  const sendMutation = useMutation({
    mutationFn: (body: string) =>
      sendMessage({ data: { conversationId: parseInt(id), body } }),
    onSuccess: () => {
      setNewMessage("")
    },
    onError: (err) => toast.error(err.message),
  })

  const statusMutation = useMutation({
    mutationFn: (status: "active" | "resolved") =>
      updateConversationStatus({ data: { conversationId: parseInt(id), status } }),
    onSuccess: () => toast.success("Status updated"),
    onError: (err) => toast.error(err.message),
  })

  const handleSend = () => {
    if (!newMessage.trim()) return
    sendMutation.mutate(newMessage.trim())
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      <div className="flex items-center gap-4 pb-4 border-b mb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/chaplain">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-semibold text-foreground">
            {conversation.isAnonymous ? (conversation.alias ?? "Anonymous") : "Conversation"}
          </h1>
          <Badge variant={conversation.status === "active" ? "default" : "secondary"}>
            {conversation.status}
          </Badge>
        </div>
        {isChaplain && (
          <div className="flex gap-2">
            {conversation.status === "active" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => statusMutation.mutate("resolved")}
                disabled={statusMutation.isPending}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Resolve
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => statusMutation.mutate("active")}
                disabled={statusMutation.isPending}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reopen
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg) => {
          const isMine =
            (isChaplain && msg.senderRole === "chaplain") ||
            (!isChaplain && msg.senderRole === "member")

          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-4 py-2.5 ${
                  isMine
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {new Date(msg.sentAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {conversation.status === "active" && (
        <div className="border-t pt-4 flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={2}
            className="flex-1 resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || sendMutation.isPending}
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      )}

      {conversation.status === "resolved" && (
        <Card className="mt-4">
          <CardContent className="py-3 text-center text-sm text-muted-foreground">
            This conversation has been resolved.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
