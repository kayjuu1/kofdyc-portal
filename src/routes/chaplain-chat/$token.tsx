import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ArrowLeft, RefreshCw, Send } from "lucide-react"
import { toast } from "sonner"
import { PublicHeader } from "@/components/PublicHeader"
import { PublicFooter } from "@/components/PublicFooter"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  getPublicConversation,
  getPublicMessages,
  resendConversationAccessLink,
  sendPublicMessage,
} from "@/functions/chaplain"

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
  const [message, setMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const conversationQuery = useQuery({
    queryKey: ["public-chaplain-conversation", token],
    queryFn: () => getPublicConversation({ data: { token } }),
    initialData: { conversation: initialData.conversation },
    refetchInterval: 5000,
  })

  const messagesQuery = useQuery({
    queryKey: ["public-chaplain-messages", token],
    queryFn: () => getPublicMessages({ data: { token } }),
    initialData: { messages: initialData.messages },
    refetchInterval: 5000,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messagesQuery.data?.messages.length])

  const sendMutation = useMutation({
    mutationFn: (body: string) => sendPublicMessage({ data: { token, body } }),
    onSuccess: async () => {
      setMessage("")
      await Promise.all([
        conversationQuery.refetch(),
        messagesQuery.refetch(),
      ])
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to send your message.")
    },
  })

  const resendMutation = useMutation({
    mutationFn: () => resendConversationAccessLink({ data: { token } }),
    onSuccess: () => toast.success("A fresh chat link has been sent to your email."),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to send a new link.")
    },
  })

  const conversation = conversationQuery.data?.conversation ?? initialData.conversation
  const messages = messagesQuery.data?.messages ?? initialData.messages

  function handleSend() {
    const trimmed = message.trim()
    if (!trimmed) return
    sendMutation.mutate(trimmed)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

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
            {messages.map((msg) => {
              const isMine = msg.senderRole === "member"

              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2.5 ${
                      isMine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <p className="text-xs font-medium mb-1 opacity-80">
                      {isMine ? conversation.alias : "Chaplain"}
                    </p>
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

          <div className="border-t p-4 space-y-3">
            {conversation.status === "resolved" && (
              <p className="text-sm text-muted-foreground">
                This conversation is currently resolved. Sending a new message will reopen it.
              </p>
            )}
            <div className="flex gap-2">
              <Textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                className="flex-1 resize-none"
                placeholder="Write your reply here..."
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending}
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
