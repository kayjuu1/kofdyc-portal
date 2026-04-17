import { useRef, useState } from "react"
import { Paperclip, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import type { ChatAttachment } from "@/functions/chaplain"

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]

type Props = {
  token?: string
  onUploaded: (attachment: ChatAttachment) => void
}

export function ChatFileUploadButton({ token, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Allowed: JPEG, PNG, WebP, GIF, PDF")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File exceeds 5MB limit")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const url = token
        ? `/api/chat/upload?token=${encodeURIComponent(token)}`
        : "/api/chat/upload"

      const res = await fetch(url, { method: "POST", body: formData })
      const result = (await res.json()) as ChatAttachment & { error?: string }

      if (!res.ok) {
        throw new Error(result.error ?? "Upload failed")
      }

      onUploaded(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.gif,.pdf"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Paperclip className="w-4 h-4" />
        )}
      </Button>
    </>
  )
}
