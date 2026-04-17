import { FileText, Download } from "lucide-react"
import { useEffect, useState } from "react"
import type { ChatAttachment } from "@/functions/chaplain"
import { getAttachmentUrl } from "@/functions/chatAttachments"

function isImage(mimeType: string) {
  return mimeType.startsWith("image/")
}

function AttachmentItem({ attachment }: { attachment: ChatAttachment }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getAttachmentUrl({ data: { key: attachment.key } }).then((result) => {
      if (!cancelled) setSignedUrl(result.url)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [attachment.key])

  if (!signedUrl) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
        <FileText className="w-4 h-4" />
        <span>{attachment.filename}</span>
      </div>
    )
  }

  if (isImage(attachment.mimeType)) {
    return (
      <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
        <img
          src={signedUrl}
          alt={attachment.filename}
          className="max-w-[240px] max-h-[180px] rounded object-cover"
          loading="lazy"
        />
      </a>
    )
  }

  return (
    <a
      href={signedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-xs mt-1.5 py-1.5 px-2 rounded bg-background/50 hover:bg-background/80 transition-colors"
    >
      <FileText className="w-4 h-4 shrink-0" />
      <span className="truncate flex-1">{attachment.filename}</span>
      <Download className="w-3.5 h-3.5 shrink-0" />
    </a>
  )
}

export function ChatAttachmentPreview({
  attachments,
}: {
  attachments: ChatAttachment[]
}) {
  if (!attachments.length) return null

  return (
    <div className="space-y-1">
      {attachments.map((att, i) => (
        <AttachmentItem key={`${att.key}-${i}`} attachment={att} />
      ))}
    </div>
  )
}
