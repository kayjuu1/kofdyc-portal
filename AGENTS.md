# AGENTS.md — kodyc-portal
**Catholic Diocese of Koforidua · Diocesan Youth Council**
_Implementation reference for autonomous agents and contributing developers_

---

## 0. How to Use This File

This file is the single source of truth for building the kodyc-portal. Read it fully before writing any code. Every section is authoritative. When in conflict, this file takes precedence over inferred conventions.

Work through the system **phase by phase** (Section 9). Within each phase, scaffold the database first, then server functions, then UI. Run the test checklist at the end of each phase before moving on.

---

## 1. Project Identity

| Field | Value |
|---|---|
| Project | kodyc-portal |
| Client | Catholic Diocese of Koforidua — Diocesan Youth Council (DYC) |
| Country | Ghana |
| Purpose | Unified digital platform for diocesan communication, event management, document archiving, programme tracking, and youth coordination |
| Version | 1.1 |
| Status | Active development |

---

## 2. Tech Stack — Use Exactly These

| Layer | Technology                       | Notes                                                                       |
|---|----------------------------------|-----------------------------------------------------------------------------|
| Framework | **TanStack Start**               | Full-stack React with SSR and server functions                              |
| Language | **TypeScript** (strict mode)     | `"strict": true` in tsconfig — no exceptions                                |
| Database | **sqlite**                            | D1                                                                          |
| ORM | **Drizzle ORM**                  | Schema-first, type-safe; no raw SQL unless absolutely necessary             |
| Auth | **Better Auth**                  | Handles roles, sessions, organisations                                      |
| File Storage | **Cloudflare R2**                | Documents, images, attachments; serve via signed URLs                       |
| Payments | **Paystack**                     | Mobile Money (MTN, Vodafone Cash, AirtelTigo), Visa, Mastercard             |
| Email | **Resend**                       | Transactional only                                                          |
| SMS | **Hubtel**                       | Ghana-based SMS gateway                                                     |
| Real-Time | **WebSocket or SSE**             | For chaplain chat notifications; use Partykit or Cloudflare Durable Objects |
| UI | **shadcn/ui + Tailwind CSS**     | Use shadcn primitives; extend with Tailwind                                 |
| Hosting | **Vercel or Cloudflare Workers** | Edge-ready; confirm with client                                             |

Do not introduce any library not listed here without explicit approval. If a library is missing, check the official docs first and note it in an `## Open Questions` comment in the relevant file.

---

## 3. Repository Structure

```
kofdyc-portal/
├── drizzle/                   # Migration files
├── src/
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   └── Header.tsx
│   ├── db/
│   │   ├── index.ts           # DB connection
│   │   ├── schema.ts          # Drizzle schema
│   │   └── seed.ts            # Seed data
│   ├── functions/
│   │   └── get-user.ts        # Session/user server functions
│   ├── lib/
│   │   ├── auth.ts            # Better Auth config (server)
│   │   ├── auth-client.ts     # Better Auth client
│   │   ├── types.ts           # Shared types
│   │   └── utils.ts           # Utility functions (cn)
│   ├── middleware/
│   │   └── auth.middleware.ts  # Auth middleware
│   ├── routes/
│   │   ├── __root.tsx         # Root layout
│   │   ├── index.tsx          # Public homepage
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── $.ts       # Better Auth API handler
│   │   ├── _auth/
│   │   │   └── index.tsx      # Sign-in page
│   │   └── _app/
│   │       ├── route.tsx      # Protected layout (auth guard)
│   │       └── dashboard.tsx  # Dashboard (placeholder)
│   ├── router.tsx
│   ├── routeTree.gen.ts
│   └── styles.css
├── .env.example
├── AGENTS.md
├── drizzle.config.ts
├── package.json
├── tsconfig.json
└── wrangler.jsonc
```

---

## 4. Environment Variables

Document every variable in `.env.example`.

```env
# Better Auth
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000
VITE_BETTER_AUTH_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_your-resend-api-key
RESEND_FROM_EMAIL=noreply@dyckoforidua.org

# App
SYSTEM_NAME=DYC Koforidua Portal
APP_URL=http://localhost:3000

# Database
DATABASE_URL=./kofdyc.db

# Cloudflare R2 (File Storage)
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=dyc-documents

# Paystack (Payments)
PAYSTACK_SECRET_KEY=sk_test_your-paystack-secret-key
PAYSTACK_PUBLIC_KEY=pk_test_your-paystack-public-key
```

---

## 5. Database Schema

Implement the full schema in `db/schema.ts` using Drizzle ORM. All tables use `uuid` primary keys generated by the database (`defaultRandom()`). All tables include `created_at` and `updated_at` timestamps managed by the ORM.

### 5.1 Core Entities

```typescript
// Diocese

```

### 5.2 News & Announcements

```typescript
// Published news articles
news: {
  id, title, body (text), cover_image_url,
  author_id → users,
  scope: enum('diocese','deanery','parish'),
  scope_ref_id (nullable — deanery or parish id depending on scope),
  status: enum('draft','published','archived'),
  is_pinned: boolean,
  published_at, created_at, updated_at
}

// Public news submissions (unmoderated)
news_submissions: {
  id, submitter_name, submitter_email, submitter_phone,
  title, body (text), image_url,
  status: enum('pending','approved','rejected'),
  reviewed_by → users (nullable),
  reviewed_at, created_at
}
```

### 5.3 Events & Registration

```typescript
// Events
events: {
  id, title, description (text),
  type: enum('mass','rally','retreat','congress','meeting','other'),
  scope: enum('diocese','deanery','parish'),
  scope_ref_id (nullable),
  start_at, end_at, venue, maps_link,
  cover_image_url, registration_deadline, capacity,
  registration_type: enum('free','paid'),
  fee_ghs: decimal (nullable),
  contact_name, contact_phone,
  status: enum('draft','published','cancelled'),
  created_by → users,
  created_at, updated_at
}

// Registrations (covers both authenticated members and guests)
registrations: {
  id,
  event_id → events,
  user_id → users (nullable — null for guest registrations),
  guest_name, guest_email, guest_phone, guest_parish (all nullable),
  payment_status: enum('not_required','pending','paid','refunded'),
  paid_at,
  cancellation_token (uuid, for guest cancellation links),
  attended: boolean (default false),
  waitlisted: boolean (default false),
  // Retreat-specific fields (nullable)
  emergency_contact_name, emergency_contact_phone,
  dietary_requirements, medical_conditions,
  tshirt_size,
  created_at
}
```

### 5.4 Documents

```typescript
documents: {
  id, title,
  category: enum('meeting_minutes','circulars','pastoral_letters','reports',
                  'constitution_guidelines','pastoral_programmes','other'),
  scope: enum('diocese','deanery','parish'),
  scope_ref_id (nullable),
  file_url, file_size_bytes, mime_type,
  uploaded_by → users,
  date_issued, created_at
}
```

### 5.5 Pastoral Programmes

```typescript
programmes: {
  id, parish_id → parishes,
  year: integer,
  status: enum('draft','submitted','under_review','approved','returned'),
  submitting_officer → users,
  pdf_attachment_url (nullable),
  submitted_at, created_at, updated_at
}

programme_activities: {
  id, programme_id → programmes,
  title, date, description, responsible_person,
  created_at
}

programme_reviews: {
  id, programme_id → programmes,
  reviewer_id → users,
  stage: enum('deanery','executive'),
  decision: enum('approved','returned'),
  comments (text, nullable),
  reviewed_at
}
```

### 5.6 Chaplain Conversations

```typescript
// One thread per conversation; alias persists for anonymous threads
chaplain_conversations: {
  id,
  user_id → users,           -- the youth member (always known server-side)
  alias: varchar(20),        -- e.g. "Youth #4821"; shown when is_anonymous=true
  is_anonymous: boolean,
  status: enum('active','resolved'),
  created_at, updated_at
}

// Individual messages within a thread
chaplain_messages: {
  id,
  conversation_id → chaplain_conversations,
  sender_role: enum('member','chaplain'),
  body: text,
  sent_at,
  read_at (nullable)         -- null = unread
}
```

### 5.7 Supplementary

```typescript
// Paystack payment records
payments: {
  id, registration_id → registrations,
  paystack_reference (unique), amount_ghs,
  status: enum('initiated','successful','failed'),
  webhook_payload (jsonb), created_at
}
```

**Schema rules:**
- Always use `ON DELETE RESTRICT` for foreign keys unless a cascade is explicitly documented above.
- Index all foreign key columns and all columns used in WHERE clauses.
- Never store plaintext passwords — Better Auth handles hashing.
- The `medical_conditions` field on `registrations` must be encrypted at rest (use a per-row AES-256 column-level encryption approach).

---

## 6. User Roles & Access Control

There are **five roles** in the system. Enforce these at the server function level — never trust the client.

| Role | Slug | Who | What they can do |
|---|---|---|---|
| System Admin | `system_admin` | DYC ICT Lead | Full access: all CRUD, role assignment, system config, user deactivation |
| Diocesan Youth Chaplain | `diocesan_youth_chaplain` | Appointed priest | Approve programmes, publish pastoral letters/circulars, access all reports, **manage chaplain inbox** |
| DYC Executive | `dyc_executive` | DYC Executive Council | Create diocese-wide events/news, manage documents, review programme submissions, access reports |
| Coordinator | `coordinator` | Deanery & Parish coordinators | Create/manage events and news within their assigned scope, submit pastoral programmes, upload documents |
| Member | `member` | Registered youth | View content, register for events, access chaplain chat, update own profile |

**RBAC implementation rules:**
- Create a `requireRole(...roles)` middleware/guard that runs in every protected server function.
- Coordinators are scoped — they can only affect data belonging to their assigned deanery or parish. Enforce this via `scope_ref_id` checks.
- The `diocesan_youth_chaplain` role has exclusive read/write access to the chaplain inbox. Even `system_admin` cannot read conversation bodies — only aggregate metadata.
- A user can hold exactly **one role** at a time. Role changes must be logged.

---

## 7. Functional Requirements

### Module 1 — Authentication & User Management

**FR-1.1 User Registration**
- Self-registration form: name, email, phone, parish, deanery.
- Default role on registration: `member`.
- Email verification required before account is active. Send verification email via Resend.
- `system_admin` can register users on behalf of others and assign any role immediately.

**FR-1.2 Login & Session Management**
- Email + password authentication via Better Auth.
- "Remember me" sessions: 30-day lifetime.
- Password reset: send OTP to registered email via Resend; OTP expires in 15 minutes.
- Changing password invalidates all existing sessions except the current one.

**FR-1.3 Role Assignment**
- Only `system_admin` may change roles.
- Role changes trigger a notification email to the affected user.
- Log role changes: who changed, what was changed, when.

**FR-1.4 User Profile**
- Profile page: name, parish, deanery, role, registration date, profile photo.
- User can update: profile photo (upload to R2), phone number, parish.
- `system_admin` can deactivate accounts (sets `is_active = false`). Deactivated users cannot log in. Do not delete accounts.

---

### Module 2 — News & Announcements

**FR-2.1 Publishing News**
- Roles with publish access: `coordinator` and above.
- Article fields: title, body (rich text — use a WYSIWYG editor from shadcn-compatible options), cover image, author (auto-set), publish date, scope (diocese/deanery/parish).
- States: `draft` → `published` → `archived`.
- `is_pinned` articles appear at the top of the homepage.

**FR-2.2 Public News Submission**
- Public form (no login): submitter name, phone or email, article title, body, optional image attachment.
- On submit: store in `news_submissions` with status `pending`. Send acknowledgement email to submitter via Resend.
- `dyc_executive` or `system_admin` reviews submissions in a moderation queue. They can edit the content, then approve or reject.
- On approval: create a `news` record and email the submitter. On rejection: email the submitter with reason.

**FR-2.3 Pastoral Letters & Circulars**
- Upload access: `diocesan_youth_chaplain`, `dyc_executive`, `system_admin`.
- Fields: title, date issued, issuing authority, PDF attachment (stored in R2).
- Accessible from a dedicated searchable archive page (search by title, date range, issuing authority).

**FR-2.4 Public Visibility**
- All published news and pastoral letters are visible without login.
- Scope filter on homepage: Diocese-wide / Deanery / Parish.

---

### Module 3 — Events & Registration

**FR-3.1 Event Creation**
- Create access: `coordinator` and above.
- Required fields: title, description, type (mass/rally/retreat/congress/meeting/other), scope, start/end datetime, venue.
- Optional fields: Google Maps link, cover image, registration deadline, capacity, contact person name and phone.
- Registration type: `free` or `paid`. If paid, fee amount in GHS is required.

**FR-3.2 Free Event Registration**
- No login required for free events.
- Collect: full name, phone, email, parish.
- On submit: store as guest registration, send confirmation email with a unique cancellation link.
- Cancellation link calls `PATCH /api/events/:id/register/:token/cancel` — sets the registration as cancelled.

**FR-3.3 Paid Event Registration**
- Requires login (authenticated users only).
- On registration: initiate a Paystack checkout session. Redirect user to Paystack hosted page.
- Confirm registration **only** on receipt of a successful `charge.success` webhook from Paystack.
- Validate the `X-Paystack-Signature` header on every webhook call. Reject invalid signatures with HTTP 400.
- Email payment receipt to registrant via Resend.
- Refunds: manual process — `system_admin` marks as `refunded` in the system and records a note.

**FR-3.4 Retreat & Camp Registration**
- For events of type `retreat`: add extra fields on the registration form:
  - Emergency contact name and phone (required)
  - Dietary requirements (text, optional)
  - Medical conditions (text, optional — encrypt at rest)
  - T-shirt/uniform size (optional — configurable per event: show/hide this field)

**FR-3.5 Registration Management**
- Event admins can view a full registrant table, export to CSV, and toggle `attended` per registrant.
- When capacity is reached, further registrations go to a waitlist. If a registered slot is cancelled, the first person on the waitlist is automatically confirmed and emailed.
- Admins can manually add or remove registrants.

---

### Module 4 — Document Repository

**FR-4.1 Document Upload**
- Upload access: `coordinator` and above.
- Accepted formats: PDF, DOCX, XLSX, images (JPG, PNG).
- Maximum file size: 20 MB. Validate on both client and server.
- Upload to Cloudflare R2. Store the resulting URL in `documents.file_url`.
- Fields: title, category, date, scope, uploader (auto-set from session).

**FR-4.2 Document Categories**
- `meeting_minutes` — council and committee meeting records
- `circulars` — official diocesan and DYC circulars
- `pastoral_letters` — letters from the Bishop
- `reports` — event reports, annual reports, committee reports
- `constitution_guidelines` — DYC constitution, liturgical guidelines
- `pastoral_programmes` — approved yearly programmes (auto-linked from Module 5)
- `other` — general documents

**FR-4.3 Document Access & Search**
- Browse by: category, scope, date range, uploader.
- Full-text search on title and metadata (use PostgreSQL `tsvector` or `ILIKE` for MVP).
- Role-restricted categories: financial reports visible only to `dyc_executive` and above.
- All download URLs must be **signed** Cloudflare R2 URLs with a maximum 1-hour expiry. Never expose a public permanent URL.

---

### Module 5 — Pastoral Programme Submission

**FR-5.1 Programme Submission**
- Submit access: `coordinator` (parish level).
- One submission per parish per calendar year.
- Fields: parish (auto-set), deanery (auto-set), submitting officer (auto-set), submission date (auto-set).
- Activities sub-form: list of planned activities, each with title, date, description, responsible person. Support add/remove rows dynamically.
- Optional: attach PDF of the full programme document.

**FR-5.2 Approval Workflow (two-stage)**
1. **Stage 1 — Deanery Coordinator review**: The deanery coordinator for the parish's deanery receives a notification. They review and either approve (advances to Stage 2) or return with written comments.
2. **Stage 2 — DYC Executive final approval**: A `dyc_executive` member reviews and gives final approval or returns with comments.
- Each review action is timestamped and attributed to the reviewer in `programme_reviews`.
- The parish admin is notified by email (via Resend) at each stage transition.

**FR-5.3 Programme Status Tracking**
- Statuses: `draft` → `submitted` → `under_review` → `approved` | `returned`
- `dyc_executive` dashboard shows all parishes and their current status.
- Overdue parishes (not submitted by a configurable deadline) are highlighted in red.

---

### Module 6 — Diocesan Programme Calendar

**FR-6.1 Calendar View**
- Unified calendar showing all events from all parishes, deaneries, and the diocese.
- Views: monthly, weekly, list.
- Filters: scope (diocese/deanery/parish), event type, date range.
- Publicly accessible (no login required).

**FR-6.2 Liturgical Calendar Integration**
- Overlay the Catholic liturgical calendar: Advent, Christmas, Lent, Easter, Ordinary Time, and major feast days.
- Use a static data file for liturgical dates — calculate seasons programmatically based on the moveable feast of Easter.
- Events can be tagged with a liturgical season.

**FR-6.3 Conflict Detection**
- When creating a new event, check for existing diocese-level events on the same date. Warn the creator (non-blocking — they can proceed).
- An event flagged as `diocesan_priority` blocks other events from being created on the same date at that scope level. Show a blocking error if a conflict is detected.

---

### Module 7 — DYC & Parish Youth Profiles

**FR-7.1 DYC Executive Profile**
- Public page listing the current DYC Executive Council.
- Fields per member: photo, name, portfolio title, contact information.
- Only `system_admin` can update this list. Changes take effect immediately on publish.

**FR-7.2 Parish Youth Group Profiles**
- One profile page per parish (auto-created when a parish is seeded).
- Displayed information: parish name, deanery, parish priest, parish youth leader name and contact, count of registered youth members, recent parish events and news, upcoming programme activities.
- Data is aggregated dynamically from existing tables — no separate profile data store needed.

> **FR-7.3 Nominations & Elections — DEFERRED TO V2.** Do not implement in this version.

---

### Module 8 — Reporting & Analytics

**FR-8.1 Admin Dashboard**
Access: `dyc_executive` and above.

Display at-a-glance cards:
- Total registered members (with month-on-month trend)
- Events this month + total registrations
- Programme submissions status across all parishes (counts by status)
- Documents uploaded this quarter
- Upcoming events in the next 30 days

**FR-8.2 Parish Engagement Leaderboard**
- Rank all parishes by an engagement score computed from:
  - Programme submission status (submitted on time = highest score)
  - Number of events created this year
  - Total member registrations for events this year
- Display as a ranked table with score. Refresh daily (cache with a 24-hour TTL).

**FR-8.3 Annual Report Generator**
- Access: `dyc_executive` and above.
- Generates a structured data report for a selected year containing:
  - Total events held and total attendance figures
  - List of parishes with approved programmes
  - New member registrations that year
  - Financial summary of paid events (total GHS collected per event)
- Exportable as a PDF (use a server-side PDF generation library — `@react-pdf/renderer` is acceptable).
- Note: Full annual report generator is partially deferred to v2. MVP: generate a structured JSON/table view; PDF export in v2.

---

### Module 9 — Talk to the Chaplain

This is a **private, confidential** messaging module. Apply extra care to access control. Never expose conversation content outside the two parties involved.

**FR-9.1 Starting a Conversation**
- Access: authenticated `member` role only.
- Entry point: "Talk to the Chaplain" link in the main navigation.
- Before the first message in a thread, prompt: **"Send as yourself"** or **"Send anonymously"**.
- This choice is **permanent for the thread** — disable the toggle after the first message is sent.
- If anonymous: generate a random alias of the form `Youth #XXXX` (4-digit random number). Store the alias in `chaplain_conversations.alias`. Show this alias as the sender label in the UI on both sides.
- A member may have multiple threads (e.g. one named, one anonymous). Each is a separate row in `chaplain_conversations`.

**FR-9.2 Messaging**
- Text only. No attachments, images, or voice notes.
- Chat-style UI: messages in chronological order, sender label (name or alias) + timestamp on each message.
- Both parties (member and chaplain) can send messages in the same thread (full two-way).
- The chaplain can mark a thread `resolved`. This disables the reply input on both sides. A member can reopen by sending a new message (sets status back to `active`).

**FR-9.3 Real-Time Notifications**
- When a member sends a message: push a real-time notification to the chaplain's browser.
- When the chaplain replies: push a real-time notification to the member's browser.
- Notification appears as: (1) a badge count on the inbox nav icon, and (2) a browser OS push notification if permission has been granted.
- Implementation: WebSocket or SSE. If deploying on Vercel, use Partykit. If on Cloudflare Workers, use Durable Objects. Choose one and document the decision in a `## Architecture Decision` comment in `lib/realtime.ts`.
- Notification scope: **browser only**. No SMS or email for chaplain messages.

**FR-9.4 Chaplain Inbox**
- Exclusive access: `diocesan_youth_chaplain` role only.
- Thread list view: sorted by most recent activity.
- Per thread in the list: sender label (name or alias), message preview (first 80 chars), timestamp, unread badge.
- Filters: All | Unread | Active | Resolved.
- Clicking a thread opens the full conversation.

**FR-9.5 Privacy & Confidentiality**
- Only the chaplain and the specific youth member can read a thread. Enforce this in every server function with an ownership check.
- `system_admin` has **no access** to conversation bodies. They may query only aggregate metadata: total thread count, total resolved count, average resolution time.
- The alias-to-user mapping (`chaplain_conversations.user_id`) is stored server-side but never returned in any API response that the chaplain can see.
- Conversation data is excluded from all dashboards, reports, CSV exports, and analytics queries.
- Log access to conversation data (who read which thread, when) in a separate `audit_log` table for compliance.

---

## 8. Non-Functional Requirements

### 8.1 Performance
- All public-facing pages: load within **2 seconds** on a standard 4G mobile connection in Ghana.
- Support at least **500 concurrent users** without degradation.
- File uploads processed **asynchronously** — UI must not block. Show progress indicator.
- Use TanStack Query for client-side caching. Stale-while-revalidate strategy for public data.

### 8.2 Security
- All transmission: **HTTPS/TLS 1.3** only.
- Passwords: hashed by Better Auth (bcrypt, cost factor ≥ 12).
- Every API/server function: enforce RBAC before any data access.
- File download URLs: signed, **maximum 1-hour expiry** from Cloudflare R2.
- Paystack webhooks: validate `X-Paystack-Signature` header — reject with HTTP 400 if invalid.
- Never log: medical conditions, payment details, chaplain conversation content.
- Rate limit auth endpoints: **10 requests per minute per IP**.
- Validate and sanitise all user input server-side — never trust the client.
- Use parameterised queries via Drizzle — never interpolate user input into SQL.

### 8.3 Availability
- Target **99.5% uptime**.
- Scheduled maintenance: notify users at least 48 hours in advance via a site banner.
- On outages: show a status banner on the homepage.

### 8.4 Mobile-First Design
- Fully responsive from **360px viewport width** upward.
- Installable as a **PWA** on Android and iOS. Configure `manifest.json` and a service worker.
- Every core user action (register for event, read news, view documents, send chaplain message) must be completable on a mobile screen without horizontal scrolling.

### 8.5 Accessibility
- Conform to **WCAG 2.1 Level AA**.
- All images: descriptive `alt` text.
- All forms: accessible labels and clear error messages.
- Colour contrast: minimum **4.5:1** for normal text.
- Use shadcn/ui components which are built on Radix UI primitives — these handle keyboard navigation and ARIA out of the box.

### 8.6 Localisation
- Interface language: **English**.
- Date/time: **West Africa Time (WAT, UTC+1)**. Store all timestamps in UTC; display in WAT.
- Currency: **Ghana Cedis (GHS)**. Format: `GHS 1,200.00`.
- Phone number fields: default country code **+233 (Ghana)**.

---

## 9. API Routes Reference

All routes are server functions in TanStack Start. Implement them in `app/routes/api/`. Apply the `requireRole()` guard as the first line of every protected function.

### Authentication
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user; send verification email |
| POST | `/api/auth/login` | Public | Authenticate; return session |
| POST | `/api/auth/reset-password` | Public | Initiate password reset; send OTP email |
| POST | `/api/auth/verify-email` | Public | Verify email with token |

### News
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/news` | Public | List published news; paginated; filterable by scope |
| POST | `/api/news` | coordinator+ | Create news article |
| PATCH | `/api/news/:id` | coordinator+ (own scope) | Edit article |
| DELETE | `/api/news/:id` | dyc_executive+ | Archive article |
| POST | `/api/news/submit` | Public | Submit public news story |
| GET | `/api/news/submissions` | dyc_executive+ | List pending moderation queue |
| PATCH | `/api/news/submissions/:id` | dyc_executive+ | Approve or reject submission |

### Events
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/events` | Public | List events; filterable by scope, type, date |
| POST | `/api/events` | coordinator+ | Create event |
| PATCH | `/api/events/:id` | coordinator+ (own scope) | Update event |
| POST | `/api/events/:id/register` | Public | Register for free event (guest) |
| POST | `/api/events/:id/pay` | member+ | Initiate Paystack session for paid event |
| PATCH | `/api/events/:id/register/:token/cancel` | Public | Cancel guest registration via token |
| POST | `/api/paystack/webhook` | Public (Paystack) | Receive payment confirmation; validate signature |
| GET | `/api/events/:id/registrants` | coordinator+ (own event) | List registrants; supports CSV export |
| PATCH | `/api/events/:id/registrants/:rid` | coordinator+ | Toggle attendance, add/remove registrant |

### Documents
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/documents` | member+ | List documents; filterable by category, scope, date |
| POST | `/api/documents/upload` | coordinator+ | Upload to R2; store metadata |
| GET | `/api/documents/:id/download` | member+ | Return signed R2 URL (1-hour expiry) |
| DELETE | `/api/documents/:id` | dyc_executive+ | Remove document |

### Programmes
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/programmes` | dyc_executive+ | List all submissions with status |
| POST | `/api/programmes` | coordinator | Submit new pastoral programme |
| PATCH | `/api/programmes/:id` | coordinator (own) | Update draft programme |
| PATCH | `/api/programmes/:id/review` | coordinator+/dyc_executive+ | Submit review decision |
| GET | `/api/programmes/:id` | coordinator+ (scoped) | Get programme detail |

### Calendar
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/calendar` | Public | Unified calendar events; filterable |

### Dashboard & Reports
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/dashboard/stats` | dyc_executive+ | Dashboard summary statistics |
| GET | `/api/dashboard/leaderboard` | dyc_executive+ | Parish engagement leaderboard |
| GET | `/api/reports/annual` | dyc_executive+ | Annual report data for given year |

### Chaplain Chat
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/chaplain/conversations` | member / chaplain | Member: own threads. Chaplain: all threads |
| POST | `/api/chaplain/conversations` | member | Start new thread; accepts `{ is_anonymous: boolean }` |
| GET | `/api/chaplain/conversations/:id/messages` | member (own) / chaplain | Fetch all messages; mark fetched messages as read |
| POST | `/api/chaplain/conversations/:id/messages` | member (own) / chaplain | Send message; triggers real-time notification |
| PATCH | `/api/chaplain/conversations/:id/status` | chaplain only | Set thread status: `active` or `resolved` |
| GET | `/api/chaplain/stats` | system_admin only | Aggregate metadata only (count, resolution rate) — no content |

---

## 10. Phased Delivery Plan

Work through phases in order. Do not skip ahead. At the end of each phase, all tests for that phase must pass before starting the next.

### Phase 0 — Foundation (Weeks 1–2)
- [ ] Scaffold TanStack Start project with TypeScript strict mode
- [ ] Configure Drizzle ORM; write the full schema from Section 5
- [ ] Run `drizzle-kit generate` and `migrate`
- [ ] Configure Better Auth with all five roles
- [ ] Seed database: diocese record, all deaneries, all parishes, one user per role for testing
- [ ] Set up Cloudflare R2 bucket; implement signed URL helper in `lib/r2.ts`
- [ ] Set up Resend; implement `sendEmail()` helper in `lib/resend.ts`
- [ ] Implement `requireRole()` RBAC guard
- [ ] Validate all env vars on startup
- [ ] Deploy skeleton to Vercel/Cloudflare; confirm CI pipeline

### Phase 1 — Core Public (Weeks 3–4)
- [ ] Homepage with latest news, upcoming events, liturgical season banner
- [ ] News listing and article detail pages (public)
- [ ] Public news submission form + moderation queue for admins
- [ ] Pastoral letters archive (searchable)
- [ ] Scope filter on homepage

### Phase 2 — Events (Weeks 5–7)
- [ ] Event listing and detail pages (public)
- [ ] Event creation form (coordinator+)
- [ ] Free event registration (no login) + confirmation email + cancellation link
- [ ] Paid event registration (authenticated) — Paystack checkout integration
- [ ] Paystack webhook handler with signature validation
- [ ] Payment receipt email via Resend
- [ ] Retreat extended fields
- [ ] Registrant management table (view, CSV export, mark attendance)
- [ ] Waitlist auto-confirmation

### Phase 3 — Documents (Week 8)
- [ ] Document repository listing with filters
- [ ] Upload form with R2 integration (max 20 MB, validated)
- [ ] Signed URL download endpoint
- [ ] Category and role-based access control
- [ ] Full-text search on title and metadata

### Phase 4 — Pastoral Programmes (Weeks 9–10)
- [ ] Programme submission form with dynamic activities sub-list
- [ ] Two-stage approval workflow with email notifications
- [ ] Status tracking dashboard for executives
- [ ] Overdue highlighting

### Phase 5 — Admin, Profiles & Chaplain Chat (Week 11)
- [ ] Role-based admin dashboards (stats cards, leaderboard)
- [ ] DYC Executive profile page (system_admin editable)
- [ ] Parish youth group profile pages (auto-aggregated)
- [ ] Diocesan calendar with liturgical overlay and conflict detection
- [ ] SMS notifications via Hubtel for key events
- [ ] **Talk to the Chaplain** module (FR-9.1 – FR-9.5)
  - [ ] "Talk to the Chaplain" page with anonymous/named prompt
  - [ ] Thread creation and chat UI
  - [ ] Chaplain inbox with filters
  - [ ] Real-time notifications (WebSocket or SSE)
  - [ ] Access control enforcement + audit logging

### Phase 6 — QA & Launch (Week 12)
- [ ] End-to-end tests covering all critical flows
- [ ] Mobile QA on Android and iOS (360px viewport)
- [ ] Performance audit (Lighthouse score ≥ 90 mobile)
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] PWA configuration: `manifest.json`, service worker, install prompt
- [ ] Security review: RBAC, signed URLs, webhook validation, rate limiting
- [ ] Soft launch at a DYC event

---

## 11. Deferred to V2 (Do Not Implement Now)

- **FR-7.3 Nominations & Elections**: online nominations form, candidate profiles, voting window, result publication.
- **Annual Report PDF export**: full PDF generation with branding; v1 produces structured data only.
- **Full analytics**: advanced charts, cohort analysis, retention metrics.
- **Native mobile app**: React Native or Expo wrapper.
- **WhatsApp Business API integration**: requires Facebook Business Manager verification.

---

## 12. Coding Standards

- **TypeScript strict mode** everywhere. No `any`. No `// @ts-ignore`.
- **Co-locate** server functions with their routes in TanStack Start convention.
- **Drizzle schema is the single source of truth.** Never create tables manually. All schema changes go through migration files.
- **Never trust the client.** Validate and authorise every input server-side.
- **Error handling**: all server functions return typed results — no unhandled promise rejections. Use a `Result<T, E>` pattern or TanStack's error boundary system.
- **No secrets in code.** Every secret is an env var. The app fails loudly if an env var is missing at startup.
- **Accessibility first.** Every interactive element must be keyboard-navigable and ARIA-labelled.
- **Comments**: write `// TODO:` for known gaps and `// OPEN QUESTION:` for items requiring client decision (see Section 13).
- **Commits**: one logical change per commit. Commit message format: `feat(module): description` | `fix(module): description` | `chore: description`.

---

## 13. Open Questions (Require Client Decision Before Implementation)

| # | Question | Notes |
|---|---|---|
| 1 | Who administers the system after launch? | A dedicated ICT lead within DYC should be identified and trained as `system_admin` |
| 2 | Hosting and domain name | Suggested: `dyckoforidua.org` or `koforidua-dyc.org` — budget needed for domain + hosting |
| 3 | Paystack merchant account | A verified Paystack merchant account must be created for the DYC or Diocese before Phase 2 |
| 4 | Official launch date | Recommend soft-launching at a DYC event for visibility and adoption |
| 5 | Data migration | Are there existing digital records (Excel sheets, Word docs) to import as seed data? |
| 6 | WhatsApp integration | WhatsApp Business API requires Facebook Business Manager verification — confirm if pursuing (V2 decision) |
| 7 | Offline functionality | Should the PWA support offline document reading for areas with poor connectivity? |
| 8 | Member verification | How are members verified as belonging to a parish? Self-declaration or admin approval? |
| 9 | Chaplain identity | Confirm the name and contact of the appointed Diocesan Youth Chaplain for seeding |
| 10 | Anonymous alias exposure | Confirm: system_admin should never be able to de-anonymise a member even under exceptional circumstances |

Mark each question as resolved in a comment `// RESOLVED: [answer]` in the relevant code when a decision is received.

---

## 14. References

| Resource | URL |
|---|---|
| TanStack Start | https://tanstack.com/start |
| Drizzle ORM | https://orm.drizzle.team |
| Better Auth | https://better-auth.com |
| Paystack Developer Docs | https://paystack.com/docs |
| Cloudflare R2 | https://developers.cloudflare.com/r2 |
| Hubtel SMS API | https://developers.hubtel.com |
| Resend Email API | https://resend.com/docs |
| shadcn/ui | https://ui.shadcn.com |
| Partykit (real-time) | https://docs.partykit.io |
| Cloudflare Durable Objects | https://developers.cloudflare.com/durable-objects |

---

_"Go therefore and make disciples of all nations." — Matthew 28:19_

**Catholic Diocese of Koforidua · Diocesan Youth Council · kodyc-portal v1.1**