import { createFileRoute, Link, redirect } from "@tanstack/react-router"
import { useEffect, useRef, useCallback } from "react"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  getChaplainMessages,
  sendChaplainMessage,
  updateConversationStatus,
  editMessage,
  deleteMessage,
  reportTyping,
} from "@/functions/chaplain"
import type { ChatAttachment } from "@/functions/chaplain"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { hasPermission, type UserRole } from "@/lib/permissions"
import { useSSEChat } from "@/components/chat/useSSEChat"
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble"
import { ChatInput } from "@/components/chat/ChatInput"
import { ChatTypingIndicator } from "@/components/chat/ChatTypingIndicator"

export const Route = createFileRoute("/_app/dashboard/chaplain/$id")({
  beforeLoad: ({ context }) => {
    const role = ((context.session.user as { role?: string }).role ?? "coordinator") as UserRole
    if (!hasPermission(role, "manageChaplainInbox")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  loader: async ({ params }) => {
    return getChaplainMessages({ data: { conversationId: parseInt(params.id) } })
  },
  component: ChatPage,
})

function ChatPage() {
  const initialData = Route.useLoaderData()
  const { id } = Route.useParams()
  const conversationId = parseInt(id)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const conversation = initialData.conversation

  const { messages, isOtherTyping } = useSSEChat({
    conversationId,
    initialMessages: initialData.messages,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, isOtherTyping])

  const sendMutation = useMutation({
    mutationFn: (params: { body: string; attachments?: string }) =>
      sendChaplainMessage({
        data: { conversationId, body: params.body, attachments: params.attachments },
      }),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Unable to send message."),
  })

  const editMutation = useMutation({
    mutationFn: (params: { messageId: number; body: string }) =>
      editMessage({ data: { messageId: params.messageId, body: params.body, conversationId } }),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Unable to edit message."),
  })

  const deleteMutation = useMutation({
    mutationFn: (messageId: number) =>
      deleteMessage({ data: { messageId, conversationId } }),
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Unable to delete message."),
  })

  const statusMutation = useMutation({
    mutationFn: (status: "active" | "resolved") =>
      updateConversationStatus({ data: { conversationId, status } }),
    onSuccess: () => toast.success("Status updated"),
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Unable to update status."),
  })

  const handleSend = useCallback(
    (body: string, attachments: ChatAttachment[]) => {
      const attachmentsJson = attachments.length > 0 ? JSON.stringify(attachments) : undefined
      sendMutation.mutate({ body, attachments: attachmentsJson })
    },
    [sendMutation],
  )

  const handleTyping = useCallback(() => {
    reportTyping({ data: { conversationId } }).catch(() => {})
  }, [conversationId])

  const handleEdit = useCallback(
    (messageId: number, newBody: string) => {
      editMutation.mutate({ messageId, body: newBody })
    },
    [editMutation],
  )

  const handleDelete = useCallback(
    (messageId: number) => {
      deleteMutation.mutate(messageId)
    },
    [deleteMutation],
  )

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
            {conversation.alias ?? "Public Contact"}
          </h1>
          <Badge variant={conversation.status === "active" ? "default" : "secondary"}>
            {conversation.status}
          </Badge>
        </div>
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
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {messages.map((msg) => (
          <ChatMessageBubble
            key={msg.id}
            message={msg}
            isMine={msg.senderRole === "chaplain"}
            senderLabel={msg.senderRole === "chaplain" ? "You" : conversation.alias}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
        {isOtherTyping && <ChatTypingIndicator name={conversation.alias} />}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t pt-4 space-y-3">
        {conversation.status === "resolved" && (
          <Card>
            <CardContent className="py-3 text-center text-sm text-muted-foreground">
              This conversation is resolved right now. Sending a reply will reopen it.
            </CardContent>
          </Card>
        )}
        <ChatInput
          onSend={handleSend}
          onTyping={handleTyping}
          disabled={sendMutation.isPending}
          placeholder="Reply to this anonymous conversation..."
        />
      </div>
    </div>
  )
}
