import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { user, account } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { requirePermission } from "@/middleware/role.middleware"
import { hashPassword } from "@/lib/auth"

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requirePermission("manageSettings")])
  .handler(async ({ context }) => {
    const result = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        parishId: user.parishId,
        deaneryId: user.deaneryId,
        image: user.image,
        role: user.role,
      })
      .from(user)
      .where(eq(user.id, context.session.user.id))
      .limit(1)

    if (!result[0]) throw new Error("User not found")
    return result[0]
  })

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageSettings")])
  .inputValidator(
    (input: {
      name: string
      phone?: string
      parishId?: number
      deaneryId?: number
      image?: string
    }) => {
      if (!input.name || input.name.trim().length < 2) {
        throw new Error("Name is required (min 2 characters)")
      }
      return input
    }
  )
  .handler(async ({ data, context }) => {
    await db
      .update(user)
      .set({
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        parishId: data.parishId ?? null,
        deaneryId: data.deaneryId ?? null,
        image: data.image || null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, context.session.user.id))

    return { success: true }
  })

export const changePassword = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageSettings")])
  .inputValidator(
    (input: {
      currentPassword: string
      newPassword: string
    }) => {
      if (!input.currentPassword) {
        throw new Error("Current password is required")
      }
      if (!input.newPassword || input.newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters")
      }
      return input
    }
  )
  .handler(async ({ data, context }) => {
    const userId = context.session.user.id

    const accounts = await db
      .select()
      .from(account)
      .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))

    const passwordRecord = accounts[0]
    if (!passwordRecord?.password) {
      throw new Error("No password set for this account")
    }

    const { verifyPassword } = await import("@/lib/auth")
    const isValid = await verifyPassword({
      hash: passwordRecord.password,
      password: data.currentPassword,
    })

    if (!isValid) {
      throw new Error("Current password is incorrect")
    }

    const newHash = await hashPassword(data.newPassword)

    await db
      .update(account)
      .set({
        password: newHash,
        updatedAt: new Date(),
      })
      .where(eq(account.id, passwordRecord.id))

    return { success: true }
  })
