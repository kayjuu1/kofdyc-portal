import { useCallback, useRef, useState } from "react"
import { Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChatFileUploadButton } from "./ChatFileUploadButton"
import type { ChatAttachment } from "@/functions/chaplain"

type Props = {
  token?: string
  onSend: (body: string, attachments: ChatAttachment[]) => void
  onTyping: () => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ token, onSend, onTyping, disabled, placeholder }: Props) {
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<ChatAttachment[]>([])
  const lastTypingRef = useRef(0)

  const handleTyping = useCallback(() => {
    const now = Date.now()
    if (now - lastTypingRef.current > 2000) {
      lastTypingRef.current = now
      onTyping()
    }
  }, [onTyping])

  function handleSend() {
    const trimmed = message.trim()
    if (!trimmed && attachments.length === 0) return
    onSend(trimmed || (attachments.length > 0 ? "Sent an attachment" : ""), attachments)
    setMessage("")
    setAttachments([])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att, i) => (
            <div
              key={att.key}
              className="flex items-center gap-1.5 text-xs bg-muted rounded px-2 py-1"
            >
              <span className="truncate max-w-[120px]">{att.filename}</span>
              <button onClick={() => removeAttachment(i)} className="hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 items-end">
        <ChatFileUploadButton
          token={token}
          onUploaded={(att) => setAttachments((prev) => [...prev, att])}
        />
        <Textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            handleTyping()
          }}
          onKeyDown={handleKeyDown}
          rows={2}
          className="flex-1 resize-none"
          placeholder={placeholder ?? "Write a message..."}
          disabled={disabled}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && attachments.length === 0)}
          className="self-end"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
