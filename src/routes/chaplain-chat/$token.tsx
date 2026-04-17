import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useRef, useCallback } from "react"
import { useMutation } from "@tanstack/react-query"
import { ArrowLeft, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getPublicConversation,
  getPublicMessages,
  resendConversationAccessLink,
  sendPublicMessage,
  editMessage,
  deleteMessage,
  reportTyping,
} from "@/functions/chaplain"
import type { ChatAttachment } from "@/functions/chaplain"
import { useSSEChat } from "@/components/chat/useSSEChat"
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble"
import { ChatInput } from "@/components/chat/ChatInput"
import { ChatTypingIndicator } from "@/components/chat/ChatTypingIndicator"

export const Route = createFileRoute("/chaplain-chat/$token")({
  loader: async ({ params }) => {
    const [conversation, messages] = await Promise.all([
      getPublicConversation({ data: { token: params.token } }),
      getPublicMessages({ data: { token: params.token } }),
    ])

    return {
      token: params.token,
      conversation: conversation.conversation,
      messages: messages.messages,
    }
  },
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Chat Link Unavailable</h1>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "This private chat link is unavailable."}
            </p>
            <Button asChild variant="outline">
              <Link to="/chaplain-contact">Start a New Chat</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      <PublicFooter />
    </div>
  ),
  component: PublicChaplainChatPage,
})

function PublicChaplainChatPage() {
  const initialData = Route.useLoaderData()
  const { token } = Route.useParams()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const conversation = initialData.conversation

  const { messages, isOtherTyping } = useSSEChat({
    conversationId: conversation.id,
    token,
    initialMessages: initialData.messages,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, isOtherTyping])

  const sendMutation = useMutation({
    mutationFn: (params: { body: string; attachments?: string }) =>
      sendPublicMessage({ data: { token, body: params.body, attachments: params.attachments } }),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to send your message.")
    },
  })

  const editMutation = useMutation({
    mutationFn: (params: { messageId: number; body: string }) =>
      editMessage({ data: { messageId: params.messageId, body: params.body, token } }),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to edit message.")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (messageId: number) =>
      deleteMessage({ data: { messageId, token } }),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete message.")
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => resendConversationAccessLink({ data: { token } }),
    onSuccess: () => toast.success("A fresh chat link has been sent to your email."),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to send a new link.")
    },
  })

  const handleSend = useCallback(
    (body: string, attachments: ChatAttachment[]) => {
      const attachmentsJson = attachments.length > 0 ? JSON.stringify(attachments) : undefined
      sendMutation.mutate({ body, attachments: attachmentsJson })
    },
    [sendMutation],
  )

  const handleTyping = useCallback(() => {
    reportTyping({ data: { token } }).catch(() => {})
  }, [token])

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
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/chaplain-contact">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Start a New Chat
          </Link>
        </Button>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-serif">{conversation.alias}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                This conversation is private. The chaplain sees only your anonymous alias.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={conversation.status === "active" ? "default" : "secondary"}>
                {conversation.status === "active" ? "Active" : "Resolved"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => resendMutation.mutate()}
                disabled={resendMutation.isPending}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Email New Link
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="rounded-lg border bg-card min-h-[32rem] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.senderRole === "member"}
                senderLabel={msg.senderRole === "member" ? conversation.alias : "Chaplain"}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
            {isOtherTyping && <ChatTypingIndicator name="Chaplain" />}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-4 space-y-3">
            {conversation.status === "resolved" && (
              <p className="text-sm text-muted-foreground">
                This conversation is currently resolved. Sending a new message will reopen it.
              </p>
            )}
            <ChatInput
              token={token}
              onSend={handleSend}
              onTyping={handleTyping}
              disabled={sendMutation.isPending}
              placeholder="Write your reply here..."
            />
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
