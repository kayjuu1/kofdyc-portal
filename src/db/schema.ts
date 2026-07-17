import { sqliteTable, text, integer, real, index, type AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import { relations, sql } from 'drizzle-orm'

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  role: text('role', {
    enum: ['system_admin', 'youth_chaplain', 'diocesan_executive', 'coordinator']
  }).notNull().default('coordinator'),
  phone: text('phone'),
  parishId: integer('parish_id'),
  deaneryId: integer('deanery_id'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  banned: integer('banned', { mode: 'boolean' }).notNull().default(false),
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
})

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
})

// userRelations defined below after all tables

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const verificationRelations = relations(verification, ({}) => ({}))

export const diocese = sqliteTable('diocese', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  bishopName: text('bishop_name'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
})

export const deaneries = sqliteTable('deaneries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  dioceseId: integer('diocese_id').references(() => diocese.id),
  deanName: text('dean_name'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
})

export const parishes = sqliteTable('parishes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  deaneryId: integer('deanery_id').references(() => deaneries.id),
  priestName: text('priest_name'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
})

export const users = user

export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  eventType: text('event_type', { 
    enum: ['mass', 'rally', 'retreat', 'congress', 'meeting', 'other'] 
  }).notNull().default('other'),
  scope: text('scope', { 
    enum: ['diocese', 'deanery', 'parish'] 
  }).notNull().default('parish'),
  scopeId: integer('scope_id'),
  startAt: text('start_at').notNull(),
  endAt: text('end_at'),
  venue: text('venue'),
  googleMapsLink: text('google_maps_link'),
  coverImageUrl: text('cover_image_url'),
  registrationDeadline: text('registration_deadline'),
  capacity: integer('capacity'),
  // Registration is always free (paid feature removed)
  contactName: text('contact_name'),
  contactPhone: text('contact_phone'),
  isDiocesanPriority: integer('is_diocesan_priority', { mode: 'boolean' }).notNull().default(false),
  liturgicalSeason: text('liturgical_season'),
  status: text('status', { 
    enum: ['draft', 'published', 'cancelled', 'completed'] 
  }).notNull().default('draft'),
  authorId: text('author_id').references(() => user.id),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
})

export const registrations = sqliteTable('registrations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  eventId: integer('event_id').references(() => events.id).notNull(),
  userId: text('user_id').references(() => user.id),
  guestName: text('guest_name'),
  guestEmail: text('guest_email'),
  guestPhone: text('guest_phone'),
  parish: text('parish'),
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactPhone: text('emergency_contact_phone'),
  dietaryRequirements: text('dietary_requirements'),
  medicalConditions: text('medical_conditions'),
  tshirtSize: text('tshirt_size'),
  registrationStatus: text('registration_status', { 
    enum: ['pending', 'confirmed', 'cancelled', 'waitlisted'] 
  }).notNull().default('pending'),
  attended: integer('attended', { mode: 'boolean' }).notNull().default(false),
  cancellationToken: text('cancellation_token'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
})

export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  category: text('category', {
    enum: ['meeting_minutes', 'circulars', 'pastoral_letters', 'reports', 'constitution_guidelines', 'pastoral_programmes', 'other']
  }).notNull().default('other'),
  scope: text('scope', { 
    enum: ['diocese', 'deanery', 'parish'] 
  }).notNull().default('diocese'),
  scopeId: integer('scope_id'),
  fileUrl: text('file_url').notNull(),
  fileName: text('file_name'),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  issuingAuthority: text('issuing_authority'),
  dateIssued: text('date_issued'),
  uploadedBy: text('uploaded_by').references(() => user.id),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
})

export const programmes = sqliteTable('programmes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  parishId: integer('parish_id').references(() => parishes.id),
  year: integer('year').notNull(),
  status: text('status', { 
    enum: ['draft', 'submitted', 'under_review', 'approved', 'returned'] 
  }).notNull().default('draft'),
  submittingOfficer: text('submitting_officer').references(() => user.id),
  submissionDate: text('submission_date'),
  finalApprovalDate: text('final_approval_date'),
  pdfUrl: text('pdf_url'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
})

export const programmeActivities = sqliteTable('programme_activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  programmeId: integer('programme_id').references(() => programmes.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  date: text('date').notNull(),
  responsiblePerson: text('responsible_person'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
})

export const submissionPrompts = sqliteTable('submission_prompts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull().default(''),
  createdBy: text('created_by').references(() => user.id),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  isSuspended: integer('is_suspended', { mode: 'boolean' }).notNull().default(false),
  expiresAt: text('expires_at'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
})

export const submissionPromptFields = sqliteTable('submission_prompt_fields', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  promptId: integer('prompt_id').references(() => submissionPrompts.id, { onDelete: 'cascade' }).notNull(),
  label: text('label').notNull(),
  placeholder: text('placeholder'),
  isRequired: integer('is_required', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  fieldType: text('field_type').notNull().default('text'), // 'text' | 'image' | 'pdf'
})

export const programmeResponses = sqliteTable('programme_responses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  programmeId: integer('programme_id').references(() => programmes.id, { onDelete: 'cascade' }).notNull(),
  fieldId: integer('field_id').references(() => submissionPromptFields.id, { onDelete: 'cascade' }).notNull(),
  value: text('value'),
})

export const newsLikes = sqliteTable('news_likes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  newsId: integer('news_id').references(() => news.id, { onDelete: 'cascade' }).notNull(),
  identifier: text('identifier').notNull(),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
})

export const newsComments = sqliteTable('news_comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  newsId: integer('news_id').references(() => news.id, { onDelete: 'cascade' }).notNull(),
  commenterName: text('commenter_name').notNull(),
  body: text('body').notNull(),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
})

export const programmeReviews = sqliteTable('programme_reviews', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  programmeId: integer('programme_id').references(() => programmes.id).notNull(),
  reviewerId: text('reviewer_id').references(() => user.id).notNull(),
  stage: integer('stage').notNull(),
  decision: text('decision', { 
    enum: ['approved', 'returned'] 
  }).notNull(),
  comment: text('comment'),
  reviewedAt: text('reviewed_at').notNull().default('CURRENT_TIMESTAMP'),
})

export const news = sqliteTable('news', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').unique(),
  body: text('body').notNull(),
  scope: text('scope', { 
    enum: ['diocese', 'deanery', 'parish'] 
  }).notNull().default('diocese'),
  scopeId: integer('scope_id'),
  coverImageUrl: text('cover_image_url'),
  images: text('images'),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  status: text('status', { 
    enum: ['draft', 'published', 'archived'] 
  }).notNull().default('draft'),
  publishedAt: text('published_at'),
  authorId: text('author_id').references(() => user.id),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').notNull().default('CURRENT_TIMESTAMP'),
})

export const newsSubmissions = sqliteTable('news_submissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  submitterName: text('submitter_name').notNull(),
  submitterEmail: text('submitter_email'),
  submitterPhone: text('submitter_phone'),
  title: text('title').notNull(),
  body: text('body').notNull(),
  imageUrl: text('image_url'),
  images: text('images'),
  status: text('status', {
    enum: ['pending', 'approved', 'rejected']
  }).notNull().default('pending'),
  reviewedBy: text('reviewed_by').references(() => user.id),
  reviewedAt: text('reviewed_at'),
  reviewComment: text('review_comment'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
})

export const dycExecutive = sqliteTable('dyc_executive', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  portfolio: text('portfolio').notNull(),
  photoUrl: text('photo_url'),
  email: text('email'),
  phone: text('phone'),
  termYear: text('term_year').notNull(),
  isCurrent: integer('is_current', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
})

// Chaplain chat removed entirely

// Payments removed entirely

export const auditLog = sqliteTable('audit_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id'),
  action: text('action').notNull(),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  metadata: text('metadata'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
})

export const dioceseRelations = relations(diocese, ({ many }) => ({
  deaneries: many(deaneries),
}))

export const deaneriesRelations = relations(deaneries, ({ one, many }) => ({
  diocese: one(diocese, {
    fields: [deaneries.dioceseId],
    references: [diocese.id],
  }),
  parishes: many(parishes),
  users: many(user),
}))

export const parishesRelations = relations(parishes, ({ one, many }) => ({
  deanery: one(deaneries, {
    fields: [parishes.deaneryId],
    references: [deaneries.id],
  }),
  users: many(user),
  programmes: many(programmes),
}))

export const usersRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  parish: one(parishes, {
    fields: [user.parishId],
    references: [parishes.id],
  }),
  registrations: many(registrations),
  events: many(events),
  news: many(news),
  programmeReviews: many(programmeReviews),
}))

export const eventsRelations = relations(events, ({ one, many }) => ({
  author: one(user, {
    fields: [events.authorId],
    references: [user.id],
  }),
  registrations: many(registrations),
}))

export const registrationsRelations = relations(registrations, ({ one, many }) => ({
  event: one(events, {
    fields: [registrations.eventId],
    references: [events.id],
  }),
  user: one(user, {
    fields: [registrations.userId],
    references: [user.id],
  }),
}))

export const documentsRelations = relations(documents, ({ one }) => ({
  uploader: one(user, {
    fields: [documents.uploadedBy],
    references: [user.id],
  }),
}))

export const programmesRelations = relations(programmes, ({ one, many }) => ({
  parish: one(parishes, {
    fields: [programmes.parishId],
    references: [parishes.id],
  }),
  submitter: one(user, {
    fields: [programmes.submittingOfficer],
    references: [user.id],
  }),
  activities: many(programmeActivities),
  reviews: many(programmeReviews),
  responses: many(programmeResponses),
}))

export const submissionPromptsRelations = relations(submissionPrompts, ({ one, many }) => ({
  creator: one(user, {
    fields: [submissionPrompts.createdBy],
    references: [user.id],
  }),
  fields: many(submissionPromptFields),
}))

export const submissionPromptFieldsRelations = relations(submissionPromptFields, ({ one }) => ({
  prompt: one(submissionPrompts, {
    fields: [submissionPromptFields.promptId],
    references: [submissionPrompts.id],
  }),
}))

export const programmeResponsesRelations = relations(programmeResponses, ({ one }) => ({
  programme: one(programmes, {
    fields: [programmeResponses.programmeId],
    references: [programmes.id],
  }),
  field: one(submissionPromptFields, {
    fields: [programmeResponses.fieldId],
    references: [submissionPromptFields.id],
  }),
}))

export const programmeActivitiesRelations = relations(programmeActivities, ({ one }) => ({
  programme: one(programmes, {
    fields: [programmeActivities.programmeId],
    references: [programmes.id],
  }),
}))

export const programmeReviewsRelations = relations(programmeReviews, ({ one }) => ({
  programme: one(programmes, {
    fields: [programmeReviews.programmeId],
    references: [programmes.id],
  }),
  reviewer: one(user, {
    fields: [programmeReviews.reviewerId],
    references: [user.id],
  }),
}))

export const newsRelations = relations(news, ({ one, many }) => ({
  author: one(user, {
    fields: [news.authorId],
    references: [user.id],
  }),
  likes: many(newsLikes),
  comments: many(newsComments),
}))

export const newsLikesRelations = relations(newsLikes, ({ one }) => ({
  article: one(news, {
    fields: [newsLikes.newsId],
    references: [news.id],
  }),
}))

export const newsCommentsRelations = relations(newsComments, ({ one }) => ({
  article: one(news, {
    fields: [newsComments.newsId],
    references: [news.id],
  }),
}))

export const newsSubmissionsRelations = relations(newsSubmissions, ({ one }) => ({
  reviewer: one(user, {
    fields: [newsSubmissions.reviewedBy],
    references: [user.id],
  }),
}))

// Chaplain chat and payments relations removed

export const featuredEvents = sqliteTable('featured_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // set null (not restrict): a featured hero must not block deleting its event;
  // the row survives and admins deactivate or re-link it
  eventId: integer('event_id').references(() => events.id, { onDelete: 'set null' }),
  displayTitle: text('display_title').notNull(),
  artworkUrl: text('artwork_url').notNull(),
  targetDate: text('target_date').notNull(),
  ctaLabel: text('cta_label').notNull().default('Event details'),
  ctaUrl: text('cta_url'),
  supportLine: text('support_line'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdBy: text('created_by').references(() => user.id),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (t) => [
  index('featured_events_event_id_idx').on(t.eventId),
  index('featured_events_created_by_idx').on(t.createdBy),
  index('featured_events_is_active_idx').on(t.isActive),
])

export const leadershipGroups = sqliteTable('leadership_groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // "First phrase|Gold phrase" — the segment after | renders in gold
  title: text('title').notNull(),
  eyebrow: text('eyebrow'),
  intro: text('intro'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
})

export const leadershipMembers = sqliteTable('leadership_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // cascade: members are owned by their group and have no standalone page
  groupId: integer('group_id').references(() => leadershipGroups.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  roleTitle: text('role_title').notNull(),
  photoUrl: text('photo_url'),
  bio: text('bio'),
  email: text('email'),
  phone: text('phone'),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (t) => [
  index('leadership_members_group_id_idx').on(t.groupId),
])

export const hierarchyNodes = sqliteTable('hierarchy_nodes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // restrict: deleting a subtree must be deliberate — the DB enforces the same
  // "delete or move children first" rule deleteHierarchyNode shows in the UI
  parentId: integer('parent_id').references((): AnySQLiteColumn => hierarchyNodes.id, { onDelete: 'restrict' }),
  type: text('type', {
    enum: ['movement', 'sub_movement', 'deanery_council', 'parish_council']
  }).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  crestUrl: text('crest_url'),
  briefHistory: text('brief_history'), // markdown source, sanitised at render
  deaneryId: integer('deanery_id').references(() => deaneries.id),
  parishId: integer('parish_id').references(() => parishes.id),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: integer('is_published', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (t) => [
  index('hierarchy_nodes_parent_id_idx').on(t.parentId),
  index('hierarchy_nodes_deanery_id_idx').on(t.deaneryId),
  index('hierarchy_nodes_parish_id_idx').on(t.parishId),
])

export const hierarchyLeaders = sqliteTable('hierarchy_leaders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // cascade: leaders are owned by their node and have no standalone page
  nodeId: integer('node_id').references(() => hierarchyNodes.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  roleTitle: text('role_title').notNull(),
  photoUrl: text('photo_url'),
  phone: text('phone'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (t) => [
  index('hierarchy_leaders_node_id_idx').on(t.nodeId),
])

export const featuredEventsRelations = relations(featuredEvents, ({ one }) => ({
  event: one(events, {
    fields: [featuredEvents.eventId],
    references: [events.id],
  }),
  creator: one(user, {
    fields: [featuredEvents.createdBy],
    references: [user.id],
  }),
}))

export const leadershipGroupsRelations = relations(leadershipGroups, ({ many }) => ({
  members: many(leadershipMembers),
}))

export const leadershipMembersRelations = relations(leadershipMembers, ({ one }) => ({
  group: one(leadershipGroups, {
    fields: [leadershipMembers.groupId],
    references: [leadershipGroups.id],
  }),
}))

export const hierarchyNodesRelations = relations(hierarchyNodes, ({ one, many }) => ({
  parent: one(hierarchyNodes, {
    fields: [hierarchyNodes.parentId],
    references: [hierarchyNodes.id],
    relationName: 'nodeChildren',
  }),
  children: many(hierarchyNodes, { relationName: 'nodeChildren' }),
  deanery: one(deaneries, {
    fields: [hierarchyNodes.deaneryId],
    references: [deaneries.id],
  }),
  parish: one(parishes, {
    fields: [hierarchyNodes.parishId],
    references: [parishes.id],
  }),
  leaders: many(hierarchyLeaders),
}))

export const hierarchyLeadersRelations = relations(hierarchyLeaders, ({ one }) => ({
  node: one(hierarchyNodes, {
    fields: [hierarchyLeaders.nodeId],
    references: [hierarchyNodes.id],
  }),
}))
