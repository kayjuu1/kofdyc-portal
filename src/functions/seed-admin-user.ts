import { createServerFn } from "@tanstack/react-start"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"

export const seedAdminUser = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      const adminEmail = "admin@dyckoforidua.org"

      const existingAdmin = await db.query.user.findFirst({
        where: (users, { eq }) => eq(users.email, adminEmail),
      })

      if (existingAdmin) {
        return {
          success: false,
          error: "Admin user already exists",
          isDuplicate: true,
        }
      }

      const result = await auth.api.signUpEmail({
        body: {
          email: adminEmail,
          password: "admin123",
          name: "ICT Administrator",
        },
      })

      if (result?.user?.id) {
        await db.update(user)
          .set({ role: "system_admin" })
          .where(eq(user.id, result.user.id))
      }

      return { success: true, user: result }
    } catch (error: unknown) {
      console.error("Error seeding admin user:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return {
        success: false,
        error: errorMessage,
        isDuplicate: errorMessage.includes("already exists") || errorMessage.includes("USER_ALREADY_EXISTS"),
      }
    }
  })
