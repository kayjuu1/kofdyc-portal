/**
 * Signed URL helper for R2 media objects.
 * Generates HMAC-SHA256 signed tokens so private objects
 * can be served through /api/media/* with expiry.
 */
import { env } from "cloudflare:workers"

async function hmacSign(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message))
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
}

/**
 * Generate a signed URL for an R2 object key.
 * @param key - R2 object key (e.g. "documents/lenten-letter-2026.pdf")
 * @param expiresInSeconds - TTL in seconds (default 3600 = 1 hour)
 * @returns URL path with query params: /api/media/{key}?expires={ts}&sig={sig}
 */
export async function getSignedUrl(
  key: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const secret = env.BETTER_AUTH_SECRET
  if (!secret) throw new Error("BETTER_AUTH_SECRET required for signed URLs")

  const expires = Math.floor(Date.now() / 1000) + expiresInSeconds
  const message = `${key}:${expires}`
  const sig = await hmacSign(secret, message)

  return `/api/media/${key}?expires=${expires}&sig=${sig}`
}

/**
 * Verify a signed URL token.
 * @returns true if the signature is valid and not expired.
 */
export async function verifySignedUrl(
  key: string,
  expires: string,
  sig: string,
): Promise<boolean> {
  const secret = env.BETTER_AUTH_SECRET
  if (!secret) return false

  const expiresNum = parseInt(expires, 10)
  if (isNaN(expiresNum) || expiresNum < Math.floor(Date.now() / 1000)) {
    return false
  }

  const message = `${key}:${expiresNum}`
  const expectedSig = await hmacSign(secret, message)
  return sig === expectedSig
}
