import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requirePermission } from "@/middleware/role.middleware"

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
        updatedAt: new Date(),
      })
      .where(eq(user.id, context.session.user.id))

    return { success: true }
  })
