import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  role: text('role', { 
    enum: ['system_admin', 'diocesan_youth_chaplain', 'dyc_executive', 'coordinator'] 
  }).notNull().default('coordinator'),
  phone: text('phone'),
  parishId: integer('parish_id'),
  deaneryId: integer('deanery_id'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
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

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  registrations: many(registrations),
  events: many(events),
  news: many(news),
  programmeReviews: many(programmeReviews),
}))

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
  registrationType: text('registration_type', { 
    enum: ['free', 'paid'] 
  }).notNull().default('free'),
  feeAmount: real('fee_amount'),
  feeCurrency: text('fee_currency').notNull().default('GHS'),
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
  paymentStatus: text('payment_status', { 
    enum: ['free', 'pending', 'paid', 'failed', 'refunded'] 
  }).notNull().default('free'),
  registrationStatus: text('registration_status', { 
    enum: ['pending', 'confirmed', 'cancelled', 'waitlisted'] 
  }).notNull().default('pending'),
  paidAt: text('paid_at'),
  paystackReference: text('paystack_reference'),
  attended: integer('attended', { mode: 'boolean' }).notNull().default(false),
  cancellationToken: text('cancellation_token'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
})

export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  category: text('category', { 
    enum: ['minutes', 'circular', 'pastoral_letter', 'report', 'constitution', 'pastoral_programme', 'other'] 
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
  parishId: integer('parish_id').references(() => parishes.id).notNull(),
  year: integer('year').notNull(),
  status: text('status', { 
    enum: ['draft', 'submitted', 'under_review', 'approved', 'returned'] 
  }).notNull().default('draft'),
  submittingOfficer: text('submitting_officer'),
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
  body: text('body').notNull(),
  scope: text('scope', { 
    enum: ['diocese', 'deanery', 'parish'] 
  }).notNull().default('diocese'),
  scopeId: integer('scope_id'),
  coverImageUrl: text('cover_image_url'),
  isFeatured: integer('is_featured', { mode: 'boolean' }).notNull().default(false),
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

export const elections = sqliteTable('elections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  nominationStart: text('nomination_start').notNull(),
  nominationEnd: text('nomination_end').notNull(),
  votingStart: text('voting_start').notNull(),
  votingEnd: text('voting_end').notNull(),
  status: text('status', { 
    enum: ['draft', 'nominations', 'voting', 'closed'] 
  }).notNull().default('draft'),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
})

export const electionCandidates = sqliteTable('election_candidates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  electionId: integer('election_id').references(() => elections.id).notNull(),
  userId: text('user_id').references(() => user.id).notNull(),
  portfolio: text('portfolio').notNull(),
  bio: text('bio'),
  photoUrl: text('photo_url'),
  votes: integer('votes').notNull().default(0),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
})

export const electionVotes = sqliteTable('election_votes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  electionId: integer('election_id').references(() => elections.id).notNull(),
  candidateId: integer('candidate_id').references(() => electionCandidates.id).notNull(),
  voterId: text('voter_id').references(() => user.id).notNull(),
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

export const registrationsRelations = relations(registrations, ({ one }) => ({
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
  activities: many(programmeActivities),
  reviews: many(programmeReviews),
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

export const newsRelations = relations(news, ({ one }) => ({
  author: one(user, {
    fields: [news.authorId],
    references: [user.id],
  }),
}))

export const newsSubmissionsRelations = relations(newsSubmissions, ({ one }) => ({
  reviewer: one(user, {
    fields: [newsSubmissions.reviewedBy],
    references: [user.id],
  }),
}))
