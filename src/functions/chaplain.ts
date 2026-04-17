import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import {
  chaplainConversations,
  chaplainConversationAccessTokens,
  chaplainMessages,
  user,
} from "@/db/schema"
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm"
import { requirePermission } from "@/middleware/role.middleware"
import { logAudit } from "@/functions/audit"
import { sendEmail } from "@/lib/resend"
import { auth } from "@/lib/auth"
import { hasPermission, canonicalizeRole } from "@/lib/permissions"
import { getRequest } from "@tanstack/react-start/server"
import { env } from "cloudflare:workers"

const ACCESS_TOKEN_TTL_DAYS = 30
const EDIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export type ChatAttachment = {
  key: string
  filename: string
  size: number
  mimeType: string
}

export type ChatMessage = {
  id: number
  senderRole: "member" | "chaplain"
  body: string
  attachments: ChatAttachment[] | null
  sentAt: string
  readAt: string | null
  editedAt: string | null
}

type PublicConversationAccess = {
  conversationId: number
  email: string
}

export type CallerIdentity = {
  conversationId: number
  senderRole: "member" | "chaplain"
}

function validateMessage(body: string, fieldName = "Message") {
  if (!body || body.trim().length < 2) {
    throw new Error(`${fieldName} must be at least 2 characters.`)
  }
  return body.trim()
}

function validateEmail(email: string) {
  const normalized = email.trim().toLowerCase()
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Please provide a valid email address.")
  }
  return normalized
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function randomToken(length: number) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return toBase64Url(bytes)
}

function toBase64Url(bytes: Uint8Array) {
  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

async function sha256(value: string) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

function generateAlias() {
  const number = crypto.getRandomValues(new Uint16Array(1))[0] % 10000
  return `Youth #${number.toString().padStart(4, "0")}`
}

function getAppUrl() {
  return (env.APP_URL ?? env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/$/, "")
}

function buildChatLink(token: string) {
  return `${getAppUrl()}/chaplain-chat/${token}`
}

function buildMagicLinkEmail(params: { alias: string; link: string }) {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin-bottom: 12px;">Your private chaplain chat link</h2>
      <p>Your anonymous conversation has been started as <strong>${params.alias}</strong>.</p>
      <p>Use the secure link below to return to the conversation and read replies from the chaplain.</p>
      <p style="margin: 24px 0;">
        <a href="${params.link}" style="background: #0f766e; color: white; padding: 12px 18px; border-radius: 8px; text-decoration: none;">
          Open Private Chat
        </a>
      </p>
      <p>If the button does not work, copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${params.link}</p>
      <p>For privacy, please keep this link to yourself.</p>
    </div>
  `
}

async function ensureChaplainAvailable() {
  const [chaplain] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.role, "youth_chaplain"), eq(user.isActive, true)))
    .limit(1)

  if (!chaplain) {
    throw new Error("The chaplain inbox is not available right now.")
  }
}

async function revokeOtherConversationTokens(conversationId: number, keepSelector: string) {
  await db
    .update(chaplainConversationAccessTokens)
    .set({ revokedAt: new Date().toISOString() })
    .where(
      and(
        eq(chaplainConversationAccessTokens.conversationId, conversationId),
        sql`${chaplainConversationAccessTokens.selector} <> ${keepSelector}`,
        isNull(chaplainConversationAccessTokens.revokedAt),
      ),
    )
}

async function createConversationAccessToken(conversationId: number, email: string) {
  const selector = randomToken(12)
  const validator = randomToken(24)
  const token = `${selector}.${validator}`
  const now = new Date()
  const expiresAt = addDays(now, ACCESS_TOKEN_TTL_DAYS).toISOString()

  await db.insert(chaplainConversationAccessTokens).values({
    conversationId,
    email,
    selector,
    tokenHash: await sha256(validator),
    expiresAt,
    createdAt: now.toISOString(),
  })

  return { token, selector }
}

async function issueMagicLink(params: {
  conversationId: number
  email: string
  alias: string
  auditAction: string
}) {
  const { token, selector } = await createConversationAccessToken(
    params.conversationId,
    params.email,
  )
  const link = buildChatLink(token)

  const emailResult = await sendEmail({
    to: params.email,
    subject: "Your private chaplain chat link",
    html: buildMagicLinkEmail({ alias: params.alias, link }),
  })

  if (!emailResult.success) {
    throw new Error(emailResult.error ?? "We could not send the chat link email.")
  }

  await revokeOtherConversationTokens(params.conversationId, selector)

  await logAudit({
    action: params.auditAction,
    resourceType: "chaplain_conversation",
    resourceId: String(params.conversationId),
  })

  return { link }
}

export async function resolveConversationAccess(token: string): Promise<PublicConversationAccess> {
  const [selector, validator] = token.split(".")
  if (!selector || !validator) {
    throw new Error("This chat link is invalid.")
  }

  const [access] = await db
    .select({
      conversationId: chaplainConversationAccessTokens.conversationId,
      email: chaplainConversationAccessTokens.email,
      tokenHash: chaplainConversationAccessTokens.tokenHash,
      expiresAt: chaplainConversationAccessTokens.expiresAt,
      revokedAt: chaplainConversationAccessTokens.revokedAt,
    })
    .from(chaplainConversationAccessTokens)
    .where(eq(chaplainConversationAccessTokens.selector, selector))
    .limit(1)

  if (!access || access.revokedAt) {
    throw new Error("This chat link is no longer valid.")
  }

  if (access.expiresAt < new Date().toISOString()) {
    throw new Error("This chat link has expired. Request a new one to continue.")
  }

  const hashedValidator = await sha256(validator)
  if (hashedValidator !== access.tokenHash) {
    throw new Error("This chat link is invalid.")
  }

  await db
    .update(chaplainConversationAccessTokens)
    .set({ lastUsedAt: new Date().toISOString() })
    .where(eq(chaplainConversationAccessTokens.selector, selector))

  return {
    conversationId: access.conversationId,
    email: access.email,
  }
}

/**
 * Dual-auth helper: resolves caller identity from either a token (anonymous member)
 * or session cookie (chaplain). Used by edit/delete/typing/SSE.
 */
export async function resolveCallerIdentity(
  request: Request,
  tokenParam?: string | null,
): Promise<CallerIdentity> {
  // Try token-based auth first (anonymous member)
  if (tokenParam) {
    const access = await resolveConversationAccess(tokenParam)
    return { conversationId: access.conversationId, senderRole: "member" }
  }

  // Fall back to session-based auth (chaplain)
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    throw new Error("Unauthorized")
  }

  const rawRole = (session.user as { role?: string }).role
  const userRole = canonicalizeRole(rawRole)
  if (!userRole || !hasPermission(userRole, "manageChaplainInbox")) {
    throw new Error("Forbidden")
  }

  // For chaplain, conversationId must come from the caller
  return { conversationId: 0, senderRole: "chaplain" }
}

async function getConversationById(conversationId: number) {
  const [conversation] = await db
    .select({
      id: chaplainConversations.id,
      alias: chaplainConversations.alias,
      status: chaplainConversations.status,
      createdAt: chaplainConversations.createdAt,
      updatedAt: chaplainConversations.updatedAt,
    })
    .from(chaplainConversations)
    .where(eq(chaplainConversations.id, conversationId))
    .limit(1)

  if (!conversation) {
    throw new Error("Conversation not found.")
  }

  return conversation
}

async function markMessagesAsRead(conversationId: number, senderRole: "member" | "chaplain") {
  await db
    .update(chaplainMessages)
    .set({ readAt: new Date().toISOString() })
    .where(
      and(
        eq(chaplainMessages.conversationId, conversationId),
        eq(chaplainMessages.senderRole, senderRole),
        isNull(chaplainMessages.readAt),
        isNull(chaplainMessages.deletedAt),
      ),
    )
}

function parseAttachments(raw: string | null): ChatAttachment[] | null {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function getConversationMessages(conversationId: number): Promise<ChatMessage[]> {
  const rows = await db
    .select({
      id: chaplainMessages.id,
      senderRole: chaplainMessages.senderRole,
      body: chaplainMessages.body,
      attachments: chaplainMessages.attachments,
      sentAt: chaplainMessages.sentAt,
      readAt: chaplainMessages.readAt,
      editedAt: chaplainMessages.editedAt,
    })
    .from(chaplainMessages)
    .where(
      and(
        eq(chaplainMessages.conversationId, conversationId),
        isNull(chaplainMessages.deletedAt),
      ),
    )
    .orderBy(chaplainMessages.sentAt)

  return rows.map((r) => ({
    ...r,
    senderRole: r.senderRole as "member" | "chaplain",
    attachments: parseAttachments(r.attachments),
  }))
}

/**
 * Fetch new/edited/deleted messages since lastMessageId and lastPollTime.
 * Used by the SSE endpoint.
 */
export async function getMessageUpdates(
  conversationId: number,
  lastMessageId: number,
  lastPollTime: string,
) {
  // New messages
  const newMessages = await db
    .select({
      id: chaplainMessages.id,
      senderRole: chaplainMessages.senderRole,
      body: chaplainMessages.body,
      attachments: chaplainMessages.attachments,
      sentAt: chaplainMessages.sentAt,
      readAt: chaplainMessages.readAt,
      editedAt: chaplainMessages.editedAt,
    })
    .from(chaplainMessages)
    .where(
      and(
        eq(chaplainMessages.conversationId, conversationId),
        gt(chaplainMessages.id, lastMessageId),
        isNull(chaplainMessages.deletedAt),
      ),
    )
    .orderBy(chaplainMessages.sentAt)

  // Edits on previously seen messages
  const editedMessages = lastMessageId > 0
    ? await db
        .select({
          id: chaplainMessages.id,
          body: chaplainMessages.body,
          attachments: chaplainMessages.attachments,
          editedAt: chaplainMessages.editedAt,
        })
        .from(chaplainMessages)
        .where(
          and(
            eq(chaplainMessages.conversationId, conversationId),
            sql`${chaplainMessages.id} <= ${lastMessageId}`,
            gt(chaplainMessages.editedAt, lastPollTime),
            isNull(chaplainMessages.deletedAt),
          ),
        )
    : []

  // Deletes on previously seen messages
  const deletedMessages = lastMessageId > 0
    ? await db
        .select({ id: chaplainMessages.id })
        .from(chaplainMessages)
        .where(
          and(
            eq(chaplainMessages.conversationId, conversationId),
            sql`${chaplainMessages.id} <= ${lastMessageId}`,
            gt(chaplainMessages.deletedAt, lastPollTime),
          ),
        )
    : []

  return {
    newMessages: newMessages.map((r) => ({
      ...r,
      senderRole: r.senderRole as "member" | "chaplain",
      attachments: parseAttachments(r.attachments),
    })),
    editedMessages: editedMessages.map((r) => ({
      ...r,
      attachments: parseAttachments(r.attachments),
    })),
    deletedMessages,
  }
}

/**
 * Check typing status of the other party.
 */
export async function getTypingStatus(conversationId: number, myRole: "member" | "chaplain") {
  const [conv] = await db
    .select({
      memberTypingAt: chaplainConversations.memberTypingAt,
      chaplainTypingAt: chaplainConversations.chaplainTypingAt,
    })
    .from(chaplainConversations)
    .where(eq(chaplainConversations.id, conversationId))
    .limit(1)

  if (!conv) return false

  const otherTypingAt = myRole === "member" ? conv.chaplainTypingAt : conv.memberTypingAt
  if (!otherTypingAt) return false

  // Typing indicator expires after 4 seconds
  return Date.now() - new Date(otherTypingAt).getTime() < 4000
}

// ─── Server Functions ───────────────────────────────────────────────

export const startAnonymousConversation = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; message: string }) => ({
    email: validateEmail(input.email),
    message: validateMessage(input.message),
  }))
  .handler(async ({ data }) => {
    await ensureChaplainAvailable()

    const now = new Date().toISOString()
    const alias = generateAlias()

    const [conversation] = await db
      .insert(chaplainConversations)
      .values({
        userId: null,
        alias,
        isAnonymous: true,
        status: "active",
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    await db.insert(chaplainMessages).values({
      conversationId: conversation.id,
      senderRole: "member",
      body: data.message,
      sentAt: now,
    })

    await issueMagicLink({
      conversationId: conversation.id,
      email: data.email,
      alias,
      auditAction: "chaplain.conversation.started",
    })

    return {
      success: true,
      conversationId: conversation.id,
      alias,
    }
  })

export const getPublicConversation = createServerFn({ method: "GET" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    const access = await resolveConversationAccess(data.token)
    const conversation = await getConversationById(access.conversationId)

    await markMessagesAsRead(access.conversationId, "chaplain")

    await logAudit({
      action: "chaplain.public.viewed",
      resourceType: "chaplain_conversation",
      resourceId: String(access.conversationId),
    })

    return {
      conversation: {
        ...conversation,
        canReply: true,
      },
    }
  })

export const getPublicMessages = createServerFn({ method: "GET" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    const access = await resolveConversationAccess(data.token)
    await markMessagesAsRead(access.conversationId, "chaplain")

    return {
      messages: await getConversationMessages(access.conversationId),
    }
  })

export const sendPublicMessage = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; body: string; attachments?: string }) => ({
    token: input.token,
    body: validateMessage(input.body),
    attachments: input.attachments,
  }))
  .handler(async ({ data }) => {
    const access = await resolveConversationAccess(data.token)
    const now = new Date().toISOString()

    const [message] = await db.insert(chaplainMessages).values({
      conversationId: access.conversationId,
      senderRole: "member",
      body: data.body,
      attachments: data.attachments ?? null,
      sentAt: now,
    }).returning()

    await db
      .update(chaplainConversations)
      .set({
        status: "active",
        updatedAt: now,
        memberTypingAt: null,
      })
      .where(eq(chaplainConversations.id, access.conversationId))

    await logAudit({
      action: "chaplain.public.replied",
      resourceType: "chaplain_conversation",
      resourceId: String(access.conversationId),
    })

    return { success: true, messageId: message.id }
  })

export const resendConversationAccessLink = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    const access = await resolveConversationAccess(data.token)
    const conversation = await getConversationById(access.conversationId)

    await issueMagicLink({
      conversationId: access.conversationId,
      email: access.email,
      alias: conversation.alias,
      auditAction: "chaplain.link.resent",
    })

    return { success: true }
  })

export const getChaplainConversations = createServerFn({ method: "GET" })
  .middleware([requirePermission("manageChaplainInbox")])
  .inputValidator((input: { status?: "active" | "resolved" }) => input)
  .handler(async ({ data, context }) => {
    const conditions = []
    if (data.status) {
      conditions.push(eq(chaplainConversations.status, data.status))
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined
    const conversations = await db
      .select({
        id: chaplainConversations.id,
        alias: chaplainConversations.alias,
        status: chaplainConversations.status,
        createdAt: chaplainConversations.createdAt,
        updatedAt: chaplainConversations.updatedAt,
      })
      .from(chaplainConversations)
      .where(where)
      .orderBy(desc(chaplainConversations.updatedAt))

    await logAudit({
      userId: context.session.user.id,
      action: "chaplain.inbox.viewed",
      resourceType: "chaplain_conversation",
    })

    return Promise.all(
      conversations.map(async (conversation) => {
        const [latestMessage] = await db
          .select({
            body: chaplainMessages.body,
            attachments: chaplainMessages.attachments,
            sentAt: chaplainMessages.sentAt,
          })
          .from(chaplainMessages)
          .where(
            and(
              eq(chaplainMessages.conversationId, conversation.id),
              isNull(chaplainMessages.deletedAt),
            ),
          )
          .orderBy(desc(chaplainMessages.sentAt))
          .limit(1)

        const [unreadCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(chaplainMessages)
          .where(
            and(
              eq(chaplainMessages.conversationId, conversation.id),
              eq(chaplainMessages.senderRole, "member"),
              isNull(chaplainMessages.readAt),
              isNull(chaplainMessages.deletedAt),
            ),
          )

        const hasAttachments = latestMessage?.attachments ? true : false

        return {
          ...conversation,
          displayName: conversation.alias,
          latestMessagePreview: latestMessage?.body?.slice(0, 80) ?? "",
          hasAttachments,
          unreadCount: unreadCount?.count ?? 0,
        }
      }),
    )
  })

export const getChaplainMessages = createServerFn({ method: "GET" })
  .middleware([requirePermission("manageChaplainInbox")])
  .inputValidator((input: { conversationId: number }) => input)
  .handler(async ({ data, context }) => {
    const conversation = await getConversationById(data.conversationId)
    await markMessagesAsRead(data.conversationId, "member")

    await logAudit({
      userId: context.session.user.id,
      action: "chaplain.thread.viewed",
      resourceType: "chaplain_conversation",
      resourceId: String(data.conversationId),
    })

    return {
      conversation,
      messages: await getConversationMessages(data.conversationId),
    }
  })

export const sendChaplainMessage = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageChaplainInbox")])
  .inputValidator((input: { conversationId: number; body: string; attachments?: string }) => ({
    conversationId: input.conversationId,
    body: validateMessage(input.body),
    attachments: input.attachments,
  }))
  .handler(async ({ data, context }) => {
    await getConversationById(data.conversationId)
    const now = new Date().toISOString()

    const [message] = await db
      .insert(chaplainMessages)
      .values({
        conversationId: data.conversationId,
        senderRole: "chaplain",
        body: data.body,
        attachments: data.attachments ?? null,
        sentAt: now,
      })
      .returning()

    await db
      .update(chaplainConversations)
      .set({
        status: "active",
        updatedAt: now,
        chaplainTypingAt: null,
      })
      .where(eq(chaplainConversations.id, data.conversationId))

    await logAudit({
      userId: context.session.user.id,
      action: "chaplain.message.sent",
      resourceType: "chaplain_conversation",
      resourceId: String(data.conversationId),
    })

    return message
  })

export const editMessage = createServerFn({ method: "POST" })
  .inputValidator((input: {
    messageId: number
    body: string
    token?: string
    conversationId?: number
  }) => ({
    messageId: input.messageId,
    body: validateMessage(input.body),
    token: input.token,
    conversationId: input.conversationId,
  }))
  .handler(async ({ data }) => {
    const identity = await resolveCallerIdentity(getRequest(), data.token)
    const convId = identity.senderRole === "member"
      ? identity.conversationId
      : data.conversationId

    if (!convId) throw new Error("Conversation ID required.")

    const [msg] = await db
      .select({
        id: chaplainMessages.id,
        senderRole: chaplainMessages.senderRole,
        conversationId: chaplainMessages.conversationId,
        sentAt: chaplainMessages.sentAt,
        deletedAt: chaplainMessages.deletedAt,
      })
      .from(chaplainMessages)
      .where(eq(chaplainMessages.id, data.messageId))
      .limit(1)

    if (!msg || msg.deletedAt) throw new Error("Message not found.")
    if (msg.conversationId !== convId) throw new Error("Message not in this conversation.")
    if (msg.senderRole !== identity.senderRole) throw new Error("You can only edit your own messages.")

    const sentTime = new Date(msg.sentAt).getTime()
    if (Date.now() - sentTime > EDIT_WINDOW_MS) {
      throw new Error("Messages can only be edited within 15 minutes of sending.")
    }

    const now = new Date().toISOString()
    await db
      .update(chaplainMessages)
      .set({ body: data.body, editedAt: now })
      .where(eq(chaplainMessages.id, data.messageId))

    return { success: true }
  })

export const deleteMessage = createServerFn({ method: "POST" })
  .inputValidator((input: {
    messageId: number
    token?: string
    conversationId?: number
  }) => input)
  .handler(async ({ data }) => {
    const identity = await resolveCallerIdentity(getRequest(), data.token)
    const convId = identity.senderRole === "member"
      ? identity.conversationId
      : data.conversationId

    if (!convId) throw new Error("Conversation ID required.")

    const [msg] = await db
      .select({
        id: chaplainMessages.id,
        senderRole: chaplainMessages.senderRole,
        conversationId: chaplainMessages.conversationId,
        deletedAt: chaplainMessages.deletedAt,
      })
      .from(chaplainMessages)
      .where(eq(chaplainMessages.id, data.messageId))
      .limit(1)

    if (!msg || msg.deletedAt) throw new Error("Message not found.")
    if (msg.conversationId !== convId) throw new Error("Message not in this conversation.")
    if (msg.senderRole !== identity.senderRole) throw new Error("You can only delete your own messages.")

    const now = new Date().toISOString()
    await db
      .update(chaplainMessages)
      .set({ deletedAt: now })
      .where(eq(chaplainMessages.id, data.messageId))

    return { success: true }
  })

export const reportTyping = createServerFn({ method: "POST" })
  .inputValidator((input: {
    token?: string
    conversationId?: number
  }) => input)
  .handler(async ({ data }) => {
    const identity = await resolveCallerIdentity(getRequest(), data.token)
    const convId = identity.senderRole === "member"
      ? identity.conversationId
      : data.conversationId

    if (!convId) throw new Error("Conversation ID required.")

    const now = new Date().toISOString()
    const field = identity.senderRole === "member"
      ? { memberTypingAt: now }
      : { chaplainTypingAt: now }

    await db
      .update(chaplainConversations)
      .set(field)
      .where(eq(chaplainConversations.id, convId))

    return { success: true }
  })

export const updateConversationStatus = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageChaplainInbox")])
  .inputValidator((input: { conversationId: number; status: "active" | "resolved" }) => input)
  .handler(async ({ data, context }) => {
    await db
      .update(chaplainConversations)
      .set({
        status: data.status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(chaplainConversations.id, data.conversationId))

    await logAudit({
      userId: context.session.user.id,
      action: `chaplain.conversation.${data.status}`,
      resourceType: "chaplain_conversation",
      resourceId: String(data.conversationId),
    })

    return { success: true }
  })

export const getChaplainStats = createServerFn({ method: "GET" })
  .middleware([requirePermission("manageChaplainInbox")])
  .handler(async () => {
    const [total, active, unread] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(chaplainConversations),
      db
        .select({ count: sql<number>`count(*)` })
        .from(chaplainConversations)
        .where(eq(chaplainConversations.status, "active")),
      db
        .select({ count: sql<number>`count(DISTINCT ${chaplainMessages.conversationId})` })
        .from(chaplainMessages)
        .where(
          and(
            eq(chaplainMessages.senderRole, "member"),
            isNull(chaplainMessages.readAt),
            isNull(chaplainMessages.deletedAt),
          ),
        ),
    ])

    return {
      totalConversations: total[0]?.count ?? 0,
      activeConversations: active[0]?.count ?? 0,
      unreadConversations: unread[0]?.count ?? 0,
    }
  })
