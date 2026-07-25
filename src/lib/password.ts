// Workers-compatible password hashing using Web Crypto PBKDF2.
// Replaces bcryptjs which exceeds Cloudflare Workers CPU limits.
//
// This module must stay import-free: it relies only on globals that exist in
// both the Workers runtime and plain Node/Bun (crypto, TextEncoder, btoa,
// atob). That is what lets `scripts/seed-admin.ts` reuse the exact same hashing
// without pulling in @/lib/auth, which imports @/db and needs a request context.

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ""
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  )
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  )
  const saltB64 = uint8ArrayToBase64(salt)
  const hashB64 = uint8ArrayToBase64(new Uint8Array(hash))
  return `pbkdf2:100000:${saltB64}:${hashB64}`
}

export async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  if (hash.startsWith("pbkdf2:")) {
    const [, iterations, saltB64, hashB64] = hash.split(":")
    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0))
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
    )
    const derived = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: parseInt(iterations), hash: "SHA-256" },
      keyMaterial, 256
    )
    const derivedB64 = uint8ArrayToBase64(new Uint8Array(derived))
    return derivedB64 === hashB64
  }
  const { compare } = await import("bcryptjs")
  return compare(password, hash)
}
