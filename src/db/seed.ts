import Database from 'better-sqlite3'
import { hashPassword } from '../lib/auth'

const sqlite = new Database('kofdyc.db')

async function seed() {
  console.log('Seeding database...')

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS diocese (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      bishop_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS deaneries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      diocese_id INTEGER REFERENCES diocese(id),
      dean_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS parishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      deanery_id INTEGER REFERENCES deaneries(id),
      priest_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER NOT NULL DEFAULT 0,
      image TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'coordinator',
      phone TEXT,
      parish_id INTEGER,
      deanery_id INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      banned INTEGER NOT NULL DEFAULT 0
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      access_token_expires_at INTEGER,
      refresh_token_expires_at INTEGER,
      scope TEXT,
      password TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      expires_at INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      event_type TEXT NOT NULL DEFAULT 'other',
      scope TEXT NOT NULL DEFAULT 'parish',
      scope_id INTEGER,
      start_at TEXT NOT NULL,
      end_at TEXT,
      venue TEXT,
      google_maps_link TEXT,
      cover_image_url TEXT,
      registration_deadline TEXT,
      capacity INTEGER,
      registration_type TEXT NOT NULL DEFAULT 'free',
      fee_amount REAL,
      fee_currency TEXT NOT NULL DEFAULT 'GHS',
      contact_name TEXT,
      contact_phone TEXT,
      is_diocesan_priority INTEGER NOT NULL DEFAULT 0,
      liturgical_season TEXT,
      status TEXT NOT NULL DEFAULT 'draft',
      author_id TEXT REFERENCES user(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id),
      user_id TEXT REFERENCES user(id),
      guest_name TEXT,
      guest_email TEXT,
      guest_phone TEXT,
      parish TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      dietary_requirements TEXT,
      medical_conditions TEXT,
      tshirt_size TEXT,
      payment_status TEXT NOT NULL DEFAULT 'not_required',
      registration_status TEXT NOT NULL DEFAULT 'pending',
      paid_at TEXT,
      paystack_reference TEXT,
      attended INTEGER NOT NULL DEFAULT 0,
      cancellation_token TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'other',
      scope TEXT NOT NULL DEFAULT 'diocese',
      scope_id INTEGER,
      file_url TEXT NOT NULL,
      file_name TEXT,
      file_size INTEGER,
      mime_type TEXT,
      issuing_authority TEXT,
      date_issued TEXT,
      uploaded_by TEXT REFERENCES user(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS programmes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parish_id INTEGER NOT NULL REFERENCES parishes(id),
      year INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      submitting_officer TEXT REFERENCES user(id),
      submission_date TEXT,
      final_approval_date TEXT,
      pdf_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS programme_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      programme_id INTEGER NOT NULL REFERENCES programmes(id),
      title TEXT NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      responsible_person TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS programme_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      programme_id INTEGER NOT NULL REFERENCES programmes(id),
      reviewer_id TEXT NOT NULL REFERENCES user(id),
      stage INTEGER NOT NULL,
      decision TEXT NOT NULL,
      comment TEXT,
      reviewed_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      body TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'diocese',
      scope_id INTEGER,
      cover_image_url TEXT,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      published_at TEXT,
      author_id TEXT REFERENCES user(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS news_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submitter_name TEXT NOT NULL,
      submitter_email TEXT,
      submitter_phone TEXT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      image_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      reviewed_by TEXT REFERENCES user(id),
      reviewed_at TEXT,
      review_comment TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS dyc_executive (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      portfolio TEXT NOT NULL,
      photo_url TEXT,
      email TEXT,
      phone TEXT,
      term_year TEXT NOT NULL,
      is_current INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS chaplain_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES user(id),
      alias TEXT,
      is_anonymous INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS chaplain_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES chaplain_conversations(id),
      sender_role TEXT NOT NULL,
      body TEXT NOT NULL,
      sent_at TEXT NOT NULL DEFAULT (datetime('now')),
      read_at TEXT
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      registration_id INTEGER NOT NULL REFERENCES registrations(id),
      paystack_reference TEXT UNIQUE,
      amount_ghs REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'initiated',
      webhook_payload TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const existingDiocese = sqlite.prepare('SELECT id FROM diocese LIMIT 1').get()
  if (existingDiocese) {
    console.log('Database already seeded. Skipping...')
    return
  }

  // Diocese
  const dioceseResult = sqlite.prepare(`
    INSERT INTO diocese (name, bishop_name) VALUES (?, ?)
  `).run('Diocese of Koforidua', 'Most Rev. Dr. Samuel Osei Akrofi')
  const dioceseId = dioceseResult.lastInsertRowid

  // Deaneries and Parishes
  const deaneriesData = [
    { name: 'Suhum Deanery', dean: 'Rev. Fr. Emmanuel Mensah' },
    { name: 'Nsawotafo Deanery', dean: 'Rev. Fr. Joseph Kwaku Boateng' },
    { name: 'Koforidua Central Deanery', dean: 'Rev. Fr. Peter Yaw Oppong' },
    { name: 'Akwapim Deanery', dean: 'Rev. Fr. Francis Kofi Acheampong' },
    { name: 'Akuapim South Deanery', dean: 'Rev. Fr. Thomas Mensah' },
  ]

  for (const d of deaneriesData) {
    const deaneryResult = sqlite.prepare(`
      INSERT INTO deaneries (name, diocese_id, dean_name) VALUES (?, ?, ?)
    `).run(d.name, dioceseId, d.dean)
    const deaneryId = deaneryResult.lastInsertRowid

    const parishesData = [
      { name: `St. Joseph's Parish ${d.name.split(' ')[0]}`, priest: `Rev. Fr. ${d.name.split(' ')[0]} Ato` },
      { name: `St. Mary's Parish ${d.name.split(' ')[0]}`, priest: `Rev. Fr. ${d.name.split(' ')[0]} Kofi` },
      { name: `St. Augustine's Parish ${d.name.split(' ')[0]}`, priest: `Rev. Fr. ${d.name.split(' ')[0]} Mensah` },
      { name: `St. Theresa's Parish ${d.name.split(' ')[0]}`, priest: `Rev. Fr. ${d.name.split(' ')[0]} Adjei` },
    ]

    for (const p of parishesData) {
      sqlite.prepare(`
        INSERT INTO parishes (name, deanery_id, priest_name) VALUES (?, ?, ?)
      `).run(p.name, deaneryId, p.priest)
    }
  }

  const firstParish = sqlite.prepare('SELECT id FROM parishes LIMIT 1').get() as { id: number }
  // Users (admin roles only)
  const adminPassword = await hashPassword('admin123')
  const password = await hashPassword('password123')
  const now = Math.floor(Date.now() / 1000) // epoch seconds for user timestamps

  const adminId = crypto.randomUUID()
  const chaplainId = crypto.randomUUID()
  const executiveId = crypto.randomUUID()
  const coordinatorId = crypto.randomUUID()

  sqlite.prepare(`
    INSERT INTO user (id, name, email, email_verified, created_at, updated_at, role, phone, parish_id, banned)
    VALUES (?, ?, ?, 1, ?, ?, 'system_admin', '+233244123456', ?, 0)
  `).run(adminId, 'ICT Administrator', 'admin@dyckoforidua.org', now, now, firstParish?.id)

  sqlite.prepare(`
    INSERT INTO user (id, name, email, email_verified, created_at, updated_at, role, phone, banned)
    VALUES (?, ?, ?, 1, ?, ?, 'youth_chaplain', '+233244234567', 0)
  `).run(chaplainId, 'Fr. Emmanuel Asamoah', 'chaplain@dyckoforidua.org', now, now)

  sqlite.prepare(`
    INSERT INTO user (id, name, email, email_verified, created_at, updated_at, role, phone, parish_id, banned)
    VALUES (?, ?, ?, 1, ?, ?, 'diocesan_executive', '+233244345678', ?, 0)
  `).run(executiveId, 'Kojo Mensah', 'chairman@dyckoforidua.org', now, now, firstParish?.id)

  sqlite.prepare(`
    INSERT INTO user (id, name, email, email_verified, created_at, updated_at, role, phone, parish_id, banned)
    VALUES (?, ?, ?, 1, ?, ?, 'coordinator', '+233244456789', ?, 0)
  `).run(coordinatorId, 'Kwame Antwi', 'coordinator@dyckoforidua.org', now, now, firstParish?.id)

  // Create credential accounts for Better Auth
  const accountTimestamp = Math.floor(Date.now() / 1000)
  for (const [userId, pwd] of [
    [adminId, adminPassword],
    [chaplainId, password],
    [executiveId, password],
    [coordinatorId, password],
  ] as const) {
    sqlite.prepare(`
      INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at)
      VALUES (?, ?, 'credential', ?, ?, ?, ?)
    `).run(crypto.randomUUID(), userId, userId, pwd, accountTimestamp, accountTimestamp)
  }

  // DYC Executive Council
  sqlite.prepare(`
    INSERT INTO dyc_executive (name, portfolio, email, phone, term_year, is_current)
    VALUES
    ('Kojo Mensah', 'Chairman', 'chairman@dyckoforidua.org', '+233244345678', '2026-2028', 1),
    ('Abena Serwaa', 'Vice Chairperson', 'vice@dyckoforidua.org', '+233244456789', '2026-2028', 1),
    ('Yaw Boateng', 'General Secretary', 'secretary@dyckoforidua.org', '+233244567890', '2026-2028', 1),
    ('Akua Afriyie', 'Organizing Secretary', 'org@dyckoforidua.org', '+233244678901', '2026-2028', 1),
    ('Kwame Osei', 'Treasurer', 'treasurer@dyckoforidua.org', '+233244789012', '2026-2028', 1),
    ('Efua Mansa', 'PRO', 'pro@dyckoforidua.org', '+233244890123', '2026-2028', 1)
  `).run()

  // News articles (published, with slugs)
  sqlite.prepare(`
    INSERT INTO news (title, slug, body, scope, is_pinned, status, published_at, author_id, created_at, updated_at)
    VALUES
    ('Diocesan Youth Congress 2026: A Gathering of Faith and Fellowship',
     'diocesan-youth-congress-2026',
     'Preparations are underway for the biggest youth gathering of the year. All parishes across the five deaneries are encouraged to participate in this celebration of our Catholic youth identity. The congress will feature keynote speakers, workshops on faith and leadership, and opportunities for fellowship among young people from across the diocese. Registration opens soon — watch this space for updates.',
     'diocese', 1, 'published', '${now}', '${executiveId}', '${now}', '${now}'),

    ('Lenten Retreat Series Begins This Weekend',
     'lenten-retreat-series-2026',
     'Join us for a series of spiritual retreats throughout the Lenten season at various parishes across the diocese. This year''s theme focuses on prayer, fasting, and almsgiving as pillars of our Lenten journey. Each retreat will feature guided meditations, Eucharistic adoration, and the Sacrament of Reconciliation. Contact your parish coordinator for the schedule in your deanery.',
     'diocese', 0, 'published', '${now}', '${chaplainId}', '${now}', '${now}'),

    ('DYC Executive Council Meeting Highlights',
     'dyc-executive-meeting-february-2026',
     'Key decisions from the February meeting including programme approvals and upcoming event planning. The Executive Council approved the annual budget, reviewed pastoral programme submissions from 12 parishes, and finalized plans for the Youth Day celebration in June. A new subcommittee on digital evangelization was also formed.',
     'diocese', 0, 'published', '${now}', '${executiveId}', '${now}', '${now}'),

    ('New Portal Launch Announcement',
     'new-portal-launch',
     'We are excited to announce the launch of our new digital platform for the Diocese of Koforidua. The DYC Koforidua Portal serves as the central hub for youth activities, events, news, documents, and diocesan communication.',
     'diocese', 0, 'published', '${now}', '${adminId}', '${now}', '${now}'),

    ('Youth Leadership Training Workshop',
     'youth-leadership-training-2026',
     'Applications now open for the annual leadership development programme for parish youth coordinators. The two-day workshop will cover topics including servant leadership, project management, public speaking, and spiritual formation. Spaces are limited to 50 participants. Apply through your deanery coordinator by March 30, 2026.',
     'diocese', 0, 'published', '${now}', '${executiveId}', '${now}', '${now}'),

    ('Pastoral Programme Submissions Due March 31',
     'pastoral-programme-deadline-2026',
     'Reminder to all parish coordinators: pastoral programme submissions for 2026 are due by March 31. Each parish is required to submit their planned activities for the year, including spiritual formation events, community outreach programmes, and youth engagement initiatives. Late submissions will delay the approval process.',
     'diocese', 0, 'published', '${now}', '${coordinatorId}', '${now}', '${now}')
  `).run()

  // News submissions (various statuses)
  sqlite.prepare(`
    INSERT INTO news_submissions (submitter_name, submitter_email, submitter_phone, title, body, status, created_at)
    VALUES
    ('Grace Owusu', 'grace.owusu@email.com', '+233201234567',
     'St. Peter''s Parish Youth Group Organizes Community Cleanup',
     'The youth group of St. Peter''s Parish in Suhum organized a successful community cleanup exercise last Saturday. Over 30 young people participated, cleaning streets and drainage channels around the parish and the local market area. The event was supported by the parish priest and local assembly members. The youth plan to make this a monthly initiative.',
     'pending', '${now}'),

    ('Samuel Addo', 'samuel.addo@email.com', NULL,
     'Bible Quiz Competition Results',
     'Congratulations to St. Augustine''s Parish Koforidua for winning the inter-parish Bible Quiz Competition held on February 15. Teams from 8 parishes participated in the event which tested knowledge of the Gospel of Matthew. The winning team will represent the diocese at the national Catholic Youth Bible Quiz in Accra.',
     'approved', '${now}'),

    ('Akosua Bempong', NULL, '+233209876543',
     'Request for Youth Camp',
     'I would like to request that the DYC organizes a youth camp during the Easter holidays. Many of us would benefit from a few days of spiritual retreat and fellowship. Please consider this for the upcoming holiday period.',
     'rejected', '${now}')
  `).run()

  // Pastoral letters (documents)
  sqlite.prepare(`
    INSERT INTO documents (title, category, scope, file_url, file_name, file_size, mime_type, issuing_authority, date_issued, uploaded_by, created_at)
    VALUES
    ('Lenten Pastoral Letter 2026', 'pastoral_letters', 'diocese',
     '/documents/lenten-letter-2026.pdf', 'lenten-letter-2026.pdf', 245000, 'application/pdf',
     'Most Rev. Dr. Samuel Osei Akrofi', '2026-02-14', '${chaplainId}', '${now}'),

    ('DYC Constitution and Guidelines (Revised 2025)', 'pastoral_letters', 'diocese',
     '/documents/dyc-constitution-2025.pdf', 'dyc-constitution-2025.pdf', 1250000, 'application/pdf',
     'DYC Executive Council', '2025-12-01', '${executiveId}', '${now}'),

    ('Circular: Youth Day Celebration 2026', 'pastoral_letters', 'diocese',
     '/documents/circular-youth-day-2026.pdf', 'circular-youth-day-2026.pdf', 180000, 'application/pdf',
     'DYC General Secretary', '2026-03-01', '${executiveId}', '${now}')
  `).run()

  // Events
  sqlite.prepare(`
    INSERT INTO events (title, description, event_type, scope, start_at, end_at, venue, status, registration_type, contact_name, contact_phone, author_id, created_at, updated_at)
    VALUES
    ('Diocesan Youth Day 2026',
     'Celebrating our faith and youth presence in the Diocese. A day of praise, worship, talks, and fellowship for all Catholic youth in the Diocese of Koforidua.',
     'rally', 'diocese', '2026-06-15 09:00:00', '2026-06-15 17:00:00',
     'St. Joseph''s Cathedral, Koforidua', 'published', 'free',
     'Kojo Mensah', '+233244345678', '${executiveId}', '${now}', '${now}'),

    ('Youth Retreat: Finding Peace in Christ',
     'A day of reflection and spiritual renewal for all youth. Experience guided meditations, Eucharistic adoration, and the Sacrament of Reconciliation.',
     'retreat', 'deanery', '2026-05-20 08:00:00', '2026-05-20 18:00:00',
     'St. Augustine''s Parish Hall, Koforidua', 'published', 'paid',
     'Fr. Emmanuel Asamoah', '+233244234567', '${chaplainId}', '${now}', '${now}'),

    ('Monthly Youth Mass — April',
     'Monthly gathering for youth mass and fellowship. All parishes welcome.',
     'mass', 'diocese', '2026-04-05 10:00:00', '2026-04-05 12:00:00',
     'All Parishes', 'published', 'free',
     NULL, NULL, '${coordinatorId}', '${now}', '${now}'),

    ('DYC Executive Meeting — May',
     'Regular executive council meeting to review progress and plan upcoming activities.',
     'meeting', 'diocese', '2026-05-10 10:00:00', '2026-05-10 13:00:00',
     'Diocesan Center, Koforidua', 'published', 'free',
     'Yaw Boateng', '+233244567890', '${executiveId}', '${now}', '${now}'),

    ('Youth Leadership Workshop',
     'Two-day intensive leadership development programme for parish youth coordinators.',
     'other', 'diocese', '2026-07-12 08:00:00', '2026-07-13 17:00:00',
     'Holy Family Conference Hall, Koforidua', 'published', 'paid',
     'Akua Afriyie', '+233244678901', '${executiveId}', '${now}', '${now}')
  `).run()

  // Set fee for paid events
  sqlite.prepare(`UPDATE events SET fee_amount = 50.00 WHERE registration_type = 'paid' AND title LIKE '%Retreat%'`).run()
  sqlite.prepare(`UPDATE events SET fee_amount = 30.00 WHERE registration_type = 'paid' AND title LIKE '%Workshop%'`).run()

  console.log('Database seeded successfully!')
  console.log('')
  console.log('Test accounts:')
  console.log('  Admin:     admin@dyckoforidua.org / admin123')
  console.log('  Chaplain:  chaplain@dyckoforidua.org / password123')
  console.log('  Executive: chairman@dyckoforidua.org / password123')
  console.log('  Coord:     coordinator@dyckoforidua.org / password123')
}

seed().catch(console.error)
