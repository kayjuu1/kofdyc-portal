import { createServerFn } from "@tanstack/react-start"
import { getSignedUrl } from "@/lib/r2"

export const getAttachmentUrl = createServerFn({ method: "GET" })
  .inputValidator((input: { key: string }) => {
    if (!input.key.startsWith("chat/")) {
      throw new Error("Invalid attachment key")
    }
    return input
  })
  .handler(async ({ data }) => {
    const url = await getSignedUrl(data.key, 3600)
    return { url }
  })
