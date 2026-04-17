import { useState } from "react"
import { Pencil, Trash2, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChatAttachmentPreview } from "./ChatAttachmentPreview"
import type { ChatMessage } from "@/functions/chaplain"

type Props = {
  message: ChatMessage
  isMine: boolean
  senderLabel: string
  onEdit?: (messageId: number, newBody: string) => void
  onDelete?: (messageId: number) => void
}

const EDIT_WINDOW_MS = 15 * 60 * 1000

export function ChatMessageBubble({ message, isMine, senderLabel, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(message.body)

  const canEditOrDelete = isMine && Date.now() - new Date(message.sentAt).getTime() < EDIT_WINDOW_MS

  function handleSaveEdit() {
    const trimmed = editBody.trim()
    if (!trimmed || trimmed === message.body) {
      setEditing(false)
      return
    }
    onEdit?.(message.id, trimmed)
    setEditing(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSaveEdit()
    }
    if (e.key === "Escape") {
      setEditing(false)
      setEditBody(message.body)
    }
  }

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} group`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2.5 relative ${
          isMine
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        <p className="text-xs font-medium mb-1 opacity-80">{senderLabel}</p>

        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              className="text-sm resize-none bg-background text-foreground"
              autoFocus
            />
            <div className="flex gap-1 justify-end">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => {
                  setEditing(false)
                  setEditBody(message.body)
                }}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleSaveEdit}
              >
                <Check className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm whitespace-pre-wrap">{message.body}</p>

            {message.attachments && message.attachments.length > 0 && (
              <ChatAttachmentPreview attachments={message.attachments} />
            )}

            <div className="flex items-center gap-1 mt-1">
              <span
                className={`text-[10px] ${
                  isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                }`}
              >
                {new Date(message.sentAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {message.editedAt && (
                <span
                  className={`text-[10px] ${
                    isMine ? "text-primary-foreground/60" : "text-muted-foreground/80"
                  }`}
                >
                  (edited)
                </span>
              )}
            </div>
          </>
        )}

        {isMine && canEditOrDelete && !editing && (
          <div className="absolute -top-2 right-1 hidden group-hover:flex gap-0.5 bg-card border rounded-md shadow-sm p-0.5">
            {onEdit && (
              <button
                onClick={() => {
                  setEditBody(message.body)
                  setEditing(true)
                }}
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                className="p-1 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
