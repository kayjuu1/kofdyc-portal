import { createServerFn } from "@tanstack/react-start"
import { db } from "@/db"
import { submissionPrompts, submissionPromptFields, programmeResponses } from "@/db/schema"
import { eq, desc, asc, sql } from "drizzle-orm"
import { requireRole, requirePermission } from "@/middleware/role.middleware"

export const getSubmissionPrompts = createServerFn({ method: "GET" })
  .middleware([requirePermission("manageSettings")])
  .handler(async () => {
    const prompts = await db.query.submissionPrompts.findMany({
      orderBy: [desc(submissionPrompts.createdAt)],
      with: {
        fields: {
          orderBy: [asc(submissionPromptFields.sortOrder)],
        },
      },
    })

    return prompts
  })

export const getSubmissionPromptById = createServerFn({ method: "GET" })
  .middleware([requirePermission("manageSettings")])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const prompt = await db.query.submissionPrompts.findFirst({
      where: eq(submissionPrompts.id, data.id),
      with: {
        fields: {
          orderBy: [asc(submissionPromptFields.sortOrder)],
        },
      },
    })

    return prompt ?? null
  })

export const getActiveSubmissionPrompt = createServerFn({ method: "GET" }).handler(async () => {
  const activePrompt = await db.query.submissionPrompts.findFirst({
    where: eq(submissionPrompts.isActive, true),
    with: {
      fields: {
        orderBy: [asc(submissionPromptFields.sortOrder)],
      },
    },
  })

  return activePrompt ?? null
})

export const createSubmissionPrompt = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageSettings")])
  .inputValidator(
    (input: {
      title: string
      fields: Array<{
        label: string
        placeholder?: string
        isRequired: boolean
        fieldType?: 'text' | 'image' | 'pdf'
      }>
      activate?: boolean
    }) => input
  )
  .handler(async ({ data, context }) => {
    const now = new Date().toISOString()

    if (data.activate) {
      await db.update(submissionPrompts).set({ isActive: false })
    }

    const [prompt] = await db.insert(submissionPrompts).values({
      title: data.title,
      createdBy: context.session.user.id,
      isActive: data.activate ?? false,
      createdAt: now,
      updatedAt: now,
    }).returning()

    if (data.fields.length > 0) {
      await db.insert(submissionPromptFields).values(
        data.fields.map((field, index) => ({
          promptId: prompt.id,
          label: field.label,
          placeholder: field.placeholder ?? null,
          isRequired: field.isRequired,
          sortOrder: index,
          fieldType: field.fieldType ?? 'text',
        }))
      )
    }

    return prompt
  })

export const updateSubmissionPrompt = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageSettings")])
  .inputValidator(
    (input: {
      id: number
      title: string
      fields: Array<{
        id?: number
        label: string
        placeholder?: string
        isRequired: boolean
        fieldType?: 'text' | 'image' | 'pdf'
      }>
      activate?: boolean
    }) => input
  )
  .handler(async ({ data }) => {
    const now = new Date().toISOString()

    // Delete existing fields and re-insert
    await db.delete(submissionPromptFields).where(eq(submissionPromptFields.promptId, data.id))

    if (data.fields.length > 0) {
      await db.insert(submissionPromptFields).values(
        data.fields.map((field, index) => ({
          promptId: data.id,
          label: field.label,
          placeholder: field.placeholder ?? null,
          isRequired: field.isRequired,
          sortOrder: index,
          fieldType: field.fieldType ?? 'text',
        }))
      )
    }

    if (data.activate) {
      await db.update(submissionPrompts).set({ isActive: false })
    }

    await db.update(submissionPrompts).set({
      title: data.title,
      isActive: data.activate ? true : undefined,
      updatedAt: now,
    }).where(eq(submissionPrompts.id, data.id))

    return { success: true }
  })

export const activateSubmissionPrompt = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageSettings")])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    const now = new Date().toISOString()

    // Deactivate all prompts
    await db.update(submissionPrompts).set({ isActive: false })

    // Activate the selected one
    await db.update(submissionPrompts).set({
      isActive: true,
      updatedAt: now,
    }).where(eq(submissionPrompts.id, data.id))

    return { success: true }
  })

export const deleteSubmissionPrompt = createServerFn({ method: "POST" })
  .middleware([requirePermission("manageSettings")])
  .inputValidator((input: { id: number }) => input)
  .handler(async ({ data }) => {
    await db.delete(submissionPromptFields).where(eq(submissionPromptFields.promptId, data.id))
    await db.delete(submissionPrompts).where(eq(submissionPrompts.id, data.id))
    return { success: true }
  })

export const saveProgrammeResponses = createServerFn({ method: "POST" })
  .middleware([requireRole("coordinator")])
  .inputValidator(
    (input: {
      programmeId: number
      responses: Array<{
        fieldId: number
        value: string
      }>
    }) => input
  )
  .handler(async ({ data }) => {
    // Delete existing responses for this programme
    await db.delete(programmeResponses).where(eq(programmeResponses.programmeId, data.programmeId))

    // Insert new responses
    if (data.responses.length > 0) {
      await db.insert(programmeResponses).values(
        data.responses.map((r) => ({
          programmeId: data.programmeId,
          fieldId: r.fieldId,
          value: r.value,
        }))
      )
    }

    return { success: true }
  })

export const getProgrammeResponses = createServerFn({ method: "GET" })
  .middleware([requirePermission("manageSettings")])
  .inputValidator((input: { programmeId: number }) => input)
  .handler(async ({ data }) => {
    const responses = await db
      .select({
        id: programmeResponses.id,
        fieldId: programmeResponses.fieldId,
        value: programmeResponses.value,
        label: submissionPromptFields.label,
        sortOrder: submissionPromptFields.sortOrder,
        fieldType: submissionPromptFields.fieldType,
      })
      .from(programmeResponses)
      .leftJoin(submissionPromptFields, eq(programmeResponses.fieldId, submissionPromptFields.id))
      .where(eq(programmeResponses.programmeId, data.programmeId))
      .orderBy(asc(submissionPromptFields.sortOrder))

    return responses
  })

export const submitPublicResponses = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      promptId: number
      responses: Array<{ fieldId: number; value: string }>
    }) => input
  )
  .handler(async ({ data }) => {
    // Verify prompt exists and is active
    const prompt = await db.query.submissionPrompts.findFirst({
      where: eq(submissionPrompts.id, data.promptId),
      with: {
        fields: true,
      },
    })

    if (!prompt || !prompt.isActive) {
      throw new Error("No active submission prompt found")
    }

    // Validate required fields
    const requiredFieldIds = prompt.fields
      .filter((f) => f.isRequired)
      .map((f) => f.id)

    for (const fieldId of requiredFieldIds) {
      const response = data.responses.find((r) => r.fieldId === fieldId)
      if (!response || !response.value.trim()) {
        const field = prompt.fields.find((f) => f.id === fieldId)
        throw new Error(`"${field?.label}" is required`)
      }
    }

    const now = new Date().toISOString()

    // Create a minimal programme record (no parish, no submitter)
    const results = await db.run(
      sql`INSERT INTO programmes (year, status, submission_date, created_at, updated_at)
          VALUES (${new Date().getFullYear()}, 'submitted', ${now}, ${now}, ${now})`
    )
    const programmeId = Number(results.meta.last_row_id)

    // Insert responses
    if (data.responses.length > 0) {
      await db.insert(programmeResponses).values(
        data.responses
          .filter((r) => r.value.trim())
          .map((r) => ({
            programmeId,
            fieldId: r.fieldId,
            value: r.value.trim(),
          }))
      )
    }

    return { success: true, programmeId }
  })
