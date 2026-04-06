import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { chaplainConversations, chaplainMessages, user } from "@/db/schema"
import { eq, and, desc, sql } from "drizzle-orm"
import { requireRole } from "@/middleware/role.middleware"
import { logAudit } from "@/functions/audit"

const ANIMAL_ALIASES = [
  "Dove", "Lamb", "Eagle", "Lion", "Sparrow", "Deer", "Fox", "Owl",
  "Robin", "Falcon", "Crane", "Swan", "Heron", "Finch", "Lark", "Wren",
]

function generateAlias(): string {
  const animal = ANIMAL_ALIASES[Math.floor(Math.random() * ANIMAL_ALIASES.length)]
  const num = Math.floor(Math.random() * 999) + 1
  return `${animal}${num}`
}

export const createConversation = createServerFn({ method: "POST" })
  .middleware([requireRole("member")])
  .inputValidator(
    (input: { isAnonymous: boolean; initialMessage: string }) => input
  )
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString()
    const alias = data.isAnonymous ? generateAlias() : null

    const [conversation] = await db.insert(chaplainConversations).values({
      userId: context.session.user.id,
      alias,
      isAnonymous: data.isAnonymous,
      status: "active",
      createdAt: now,
      updatedAt: now,
    }).returning()

    await db.insert(chaplainMessages).values({
      conversationId: conversation.id,
      senderRole: "member",
      body: data.initialMessage,
      sentAt: now,
    })

    await logAudit({
      userId: context.session.user.id,
      action: "chaplain.conversation.created",
      resourceType: "chaplain_conversation",
      resourceId: String(conversation.id),
      metadata: { isAnonymous: data.isAnonymous },
    })

    return conversation
  })

export const getConversations = createServerFn({ method: "GET" })
  .middleware([requireRole("member")])
  .inputValidator(
    (input: { status?: "active" | "resolved" }) => input
  )
  .handler(async ({ data, context }) => {
    const userRole = context.userRole

    const conditions = []
    if (data.status) {
      conditions.push(eq(chaplainConversations.status, data.status))
    }

    // Members see only their own conversations; chaplain sees all
    if (userRole !== "diocesan_youth_chaplain" && userRole !== "system_admin") {
      conditions.push(eq(chaplainConversations.userId, context.session.user.id))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const conversations = await db
      .select({
        id: chaplainConversations.id,
        alias: chaplainConversations.alias,
        isAnonymous: chaplainConversations.isAnonymous,
        status: chaplainConversations.status,
        createdAt: chaplainConversations.createdAt,
        updatedAt: chaplainConversations.updatedAt,
        userName: user.name,
      })
      .from(chaplainConversations)
      .leftJoin(user, eq(chaplainConversations.userId, user.id))
      .where(where)
      .orderBy(desc(chaplainConversations.updatedAt))

    // For anonymous conversations seen by chaplain, mask the name
    return conversations.map((c) => ({
      ...c,
      displayName: c.isAnonymous ? (c.alias ?? "Anonymous") : (c.userName ?? "Member"),
      // Don't expose real name for anonymous conversations to chaplain
      userName: c.isAnonymous && userRole !== "system_admin" ? null : c.userName,
    }))
  })

export const getMessages = createServerFn({ method: "GET" })
  .middleware([requireRole("member")])
  .inputValidator(
    (input: { conversationId: number }) => input
  )
  .handler(async ({ data, context }) => {
    // Ownership check
    const conv = await db
      .select()
      .from(chaplainConversations)
      .where(eq(chaplainConversations.id, data.conversationId))
      .limit(1)

    if (!conv[0]) throw new Error("Conversation not found")

    const userRole = context.userRole
    const isChaplainOrAdmin = userRole === "diocesan_youth_chaplain" || userRole === "system_admin"

    if (!isChaplainOrAdmin && conv[0].userId !== context.session.user.id) {
      throw new Error("Access denied")
    }

    // Mark unread messages as read
    const readerRole = isChaplainOrAdmin ? "member" : "chaplain"
    await db
      .update(chaplainMessages)
      .set({ readAt: new Date().toISOString() })
      .where(and(
        eq(chaplainMessages.conversationId, data.conversationId),
        eq(chaplainMessages.senderRole, readerRole),
        sql`${chaplainMessages.readAt} IS NULL`
      ))

    const messages = await db
      .select()
      .from(chaplainMessages)
      .where(eq(chaplainMessages.conversationId, data.conversationId))
      .orderBy(chaplainMessages.sentAt)

    return {
      messages,
      conversation: {
        id: conv[0].id,
        alias: conv[0].alias,
        isAnonymous: conv[0].isAnonymous,
        status: conv[0].status,
      },
    }
  })

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireRole("member")])
  .inputValidator(
    (input: { conversationId: number; body: string }) => input
  )
  .handler(async ({ data, context }) => {
    const conv = await db
      .select()
      .from(chaplainConversations)
      .where(eq(chaplainConversations.id, data.conversationId))
      .limit(1)

    if (!conv[0]) throw new Error("Conversation not found")
    if (conv[0].status !== "active") throw new Error("Conversation is resolved")

    const userRole = context.userRole
    const isChaplainOrAdmin = userRole === "diocesan_youth_chaplain" || userRole === "system_admin"

    if (!isChaplainOrAdmin && conv[0].userId !== context.session.user.id) {
      throw new Error("Access denied")
    }

    const senderRole = isChaplainOrAdmin ? "chaplain" : "member"
    const now = new Date().toISOString()

    const [message] = await db.insert(chaplainMessages).values({
      conversationId: data.conversationId,
      senderRole,
      body: data.body,
      sentAt: now,
    }).returning()

    await db.update(chaplainConversations).set({
      updatedAt: now,
    }).where(eq(chaplainConversations.id, data.conversationId))

    return message
  })

export const updateConversationStatus = createServerFn({ method: "POST" })
  .middleware([requireRole("diocesan_youth_chaplain")])
  .inputValidator(
    (input: { conversationId: number; status: "active" | "resolved" }) => input
  )
  .handler(async ({ data, context }) => {
    await db.update(chaplainConversations).set({
      status: data.status,
      updatedAt: new Date().toISOString(),
    }).where(eq(chaplainConversations.id, data.conversationId))

    await logAudit({
      userId: context.session.user.id,
      action: `chaplain.conversation.${data.status}`,
      resourceType: "chaplain_conversation",
      resourceId: String(data.conversationId),
    })

    return { success: true }
  })

export const getChaplainStats = createServerFn({ method: "GET" })
  .middleware([requireRole("diocesan_youth_chaplain")])
  .handler(async () => {
    const [total, active, unread] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(chaplainConversations),
      db.select({ count: sql<number>`count(*)` }).from(chaplainConversations)
        .where(eq(chaplainConversations.status, "active")),
      db.select({ count: sql<number>`count(DISTINCT ${chaplainMessages.conversationId})` })
        .from(chaplainMessages)
        .where(and(
          eq(chaplainMessages.senderRole, "member"),
          sql`${chaplainMessages.readAt} IS NULL`
        )),
    ])

    return {
      totalConversations: total[0]?.count ?? 0,
      activeConversations: active[0]?.count ?? 0,
      unreadConversations: unread[0]?.count ?? 0,
    }
  })
