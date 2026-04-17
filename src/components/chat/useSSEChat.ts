import { useCallback, useEffect, useRef, useState } from "react"
import type { ChatMessage } from "@/functions/chaplain"

type UseSSEChatOptions = {
  conversationId: number
  token?: string
  initialMessages: ChatMessage[]
}

export function useSSEChat({ conversationId, token, initialMessages }: UseSSEChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const getMaxId = (msgs: ChatMessage[]) =>
    msgs.length > 0 ? msgs.reduce((max, m) => Math.max(max, m.id), 0) : 0

  const lastMessageIdRef = useRef(getMaxId(initialMessages))
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Update messages ref when initial data changes (e.g. navigation)
  useEffect(() => {
    setMessages(initialMessages)
    lastMessageIdRef.current = getMaxId(initialMessages)
  }, [conversationId])

  const connect = useCallback(() => {
    // Clean up previous connection
    eventSourceRef.current?.close()
    clearTimeout(reconnectTimerRef.current)

    const params = new URLSearchParams()
    if (token) {
      params.set("token", token)
    } else {
      params.set("conversationId", String(conversationId))
    }
    params.set("lastMessageId", String(lastMessageIdRef.current))

    const es = new EventSource(`/api/chat/sse?${params}`)
    eventSourceRef.current = es

    es.addEventListener("message", (e) => {
      try {
        const msg: ChatMessage = JSON.parse(e.data)
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        if (msg.id > lastMessageIdRef.current) {
          lastMessageIdRef.current = msg.id
        }
      } catch {}
    })

    es.addEventListener("edit", (e) => {
      try {
        const edit: { id: number; body: string; editedAt: string | null; attachments: unknown } =
          JSON.parse(e.data)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === edit.id
              ? { ...m, body: edit.body, editedAt: edit.editedAt }
              : m,
          ),
        )
      } catch {}
    })

    es.addEventListener("delete", (e) => {
      try {
        const del: { id: number } = JSON.parse(e.data)
        setMessages((prev) => prev.filter((m) => m.id !== del.id))
      } catch {}
    })

    es.addEventListener("typing", () => {
      setIsOtherTyping(true)
      clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => setIsOtherTyping(false), 4000)
    })

    es.addEventListener("reconnect", () => {
      es.close()
      reconnectTimerRef.current = setTimeout(connect, 2000)
    })

    es.addEventListener("error", () => {
      es.close()
      reconnectTimerRef.current = setTimeout(connect, 2000)
    })
  }, [conversationId, token])

  useEffect(() => {
    connect()
    return () => {
      eventSourceRef.current?.close()
      clearTimeout(reconnectTimerRef.current)
      clearTimeout(typingTimerRef.current)
    }
  }, [connect])

  // Optimistic add for locally sent messages
  const addOptimisticMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg])
    if (msg.id > lastMessageIdRef.current) {
      lastMessageIdRef.current = msg.id
    }
  }, [])

  return { messages, isOtherTyping, addOptimisticMessage }
}
