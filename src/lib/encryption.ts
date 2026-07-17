const ALGORITHM = "AES-GCM"

function getKey(): Promise<CryptoKey> {
  const raw = process.env.MEDICAL_ENCRYPTION_KEY
  if (!raw) {
    throw new Error("MEDICAL_ENCRYPTION_KEY environment variable is required for medical_conditions encryption")
  }
  const encoder = new TextEncoder()
  const keyData = encoder.encode(raw).slice(0, 32)
  return crypto.subtle.importKey("raw", keyData, ALGORITHM, false, ["encrypt", "decrypt"])
}

export async function encryptMedicalConditions(plaintext: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoder = new TextEncoder()
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext),
  )
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)
  let binary = ""
  for (let i = 0; i < combined.length; i++) {
    binary += String.fromCharCode(combined[i])
  }
  return btoa(binary)
}

export async function decryptMedicalConditions(ciphertext: string): Promise<string> {
  const key = await getKey()
  const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)
  const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, data)
  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}
