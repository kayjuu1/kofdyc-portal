import { createServerFn } from "@tanstack/react-start"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"

const seedAccounts = [
  { email: "admin@dyckoforidua.org", password: "admin123", name: "ICT Administrator", role: "system_admin" as const },
  { email: "chaplain@dyckoforidua.org", password: "password123", name: "Fr. Emmanuel Asamoah", role: "youth_chaplain" as const },
  { email: "chairman@dyckoforidua.org", password: "password123", name: "Kojo Mensah", role: "diocesan_executive" as const },
  { email: "coordinator@dyckoforidua.org", password: "password123", name: "Kwame Antwi", role: "coordinator" as const },
]

export const seedAdminUser = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      const existingAdmin = await db.query.user.findFirst({
        where: (users, { eq }) => eq(users.email, seedAccounts[0].email),
      })

      if (existingAdmin) {
        return {
          success: false,
          error: "Admin user already exists",
          isDuplicate: true,
        }
      }

      for (const account of seedAccounts) {
        const result = await auth.api.signUpEmail({
          body: {
            email: account.email,
            password: account.password,
            name: account.name,
          },
        })

        if (result?.user?.id) {
          await db.update(user)
            .set({ role: account.role })
            .where(eq(user.id, result.user.id))
        }
      }

      return { success: true }
    } catch (error: unknown) {
      console.error("Error seeding users:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      return {
        success: false,
        error: errorMessage,
        isDuplicate: errorMessage.includes("already exists") || errorMessage.includes("USER_ALREADY_EXISTS"),
      }
    }
  })
