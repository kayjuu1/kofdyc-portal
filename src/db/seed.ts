import Database from 'better-sqlite3'
import { hashPassword } from '../lib/auth'

const sqlite = new Database('kofdyc.db')

async function seed() {
  console.log('Seeding database...')

  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS diocese (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      bishop_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS deaneries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      diocese_id INTEGER REFERENCES diocese(id),
      dean_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS parishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      deanery_id INTEGER REFERENCES deaneries(id),
      priest_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'coordinator',
      parish_id INTEGER REFERENCES parishes(id),
      email_verified INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      profile_image_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await sqlite.exec(`
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
      author_id INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL REFERENCES events(id),
      user_id INTEGER REFERENCES users(id),
      guest_name TEXT,
      guest_email TEXT,
      guest_phone TEXT,
      parish TEXT,
      emergency_contact_name TEXT,
      emergency_contact_phone TEXT,
      dietary_requirements TEXT,
      medical_conditions TEXT,
      tshirt_size TEXT,
      payment_status TEXT NOT NULL DEFAULT 'free',
      registration_status TEXT NOT NULL DEFAULT 'pending',
      paid_at TEXT,
      paystack_reference TEXT,
      attended INTEGER NOT NULL DEFAULT 0,
      cancellation_token TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await sqlite.exec(`
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
      uploaded_by INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS programmes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parish_id INTEGER NOT NULL REFERENCES parishes(id),
      year INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      submitting_officer TEXT,
      submission_date TEXT,
      final_approval_date TEXT,
      pdf_url TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await sqlite.exec(`
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

  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS programme_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      programme_id INTEGER NOT NULL REFERENCES programmes(id),
      reviewer_id INTEGER NOT NULL REFERENCES users(id),
      stage INTEGER NOT NULL,
      decision TEXT NOT NULL,
      comment TEXT,
      reviewed_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'diocese',
      scope_id INTEGER,
      cover_image_url TEXT,
      is_featured INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft',
      published_at TEXT,
      author_id INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS news_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submitter_name TEXT NOT NULL,
      submitter_email TEXT,
      submitter_phone TEXT,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      image_url TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      reviewed_by INTEGER REFERENCES users(id),
      reviewed_at TEXT,
      review_comment TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      identifier TEXT NOT NULL,
      token TEXT NOT NULL,
      type TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await sqlite.exec(`
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

  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS elections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      nomination_start TEXT NOT NULL,
      nomination_end TEXT NOT NULL,
      voting_start TEXT NOT NULL,
      voting_end TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS election_candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      election_id INTEGER NOT NULL REFERENCES elections(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      portfolio TEXT NOT NULL,
      bio TEXT,
      photo_url TEXT,
      votes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  await sqlite.exec(`
    CREATE TABLE IF NOT EXISTS election_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      election_id INTEGER NOT NULL REFERENCES elections(id),
      candidate_id INTEGER NOT NULL REFERENCES election_candidates(id),
      voter_id INTEGER NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  const existingDiocese = sqlite.prepare('SELECT id FROM diocese LIMIT 1').get()
  if (existingDiocese) {
    console.log('Database already seeded. Skipping...')
    return
  }

  const dioceseResult = sqlite.prepare(`
    INSERT INTO diocese (name, bishop_name) VALUES (?, ?)
  `).run('Diocese of Koforidua', 'Most Rev. Dr. Samuel Osei Akrofi')

  const dioceseId = dioceseResult.lastInsertRowid

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

  const adminPassword = await hashPassword('admin123')
  const coordinatorPassword = await hashPassword('coordinator123')

  sqlite.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, parish_id, email_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('ICT Administrator', 'admin@dyckoforidua.org', '+233244123456', adminPassword, 'system_admin', firstParish?.id, 1)

  sqlite.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, parish_id, email_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('Fr. Emmanuel Asamoah', 'chaplain@dyckoforidua.org', '+233244234567', coordinatorPassword, 'diocesan_youth_chaplain', null, 1)

  sqlite.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, parish_id, email_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('Kojo Mensah', 'chairman@dyckoforidua.org', '+233244345678', coordinatorPassword, 'dyc_executive', firstParish?.id, 1)

  sqlite.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, parish_id, email_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('Kwame Antwi', 'coordinator@dyckoforidua.org', '+233244456789', coordinatorPassword, 'coordinator', firstParish?.id, 1)

  sqlite.prepare(`
    INSERT INTO dyc_executive (name, portfolio, email, phone, term_year, is_current)
    VALUES 
    ('Kojo Mensah', 'Chairman', 'chairman@dyckoforidua.org', '+233244345678', '2026-2028', 1),
    ('Abena Serwaa', 'Vice Chairperson', 'vice@dyckoforidua.org', '+233244456789', '2026-2028', 1),
    ('Yaw Boateng', 'General Secretary', 'secretary@dyckoforidua.org', '+233244567890', '2026-2028', 1),
    ('Akua Afriyie', 'Organizing Secretary', 'org@dyckoforidua.org', '+233244678901', '2026-2028', 1),
    ('Kwame Osei', 'Treasurer', 'treasurer@dyckoforidua.org', '+233244789012', '2026-2028', 1),
    ('Efua Mansa', 'PRO', 'pro@dyckoforidua.org', '+233244890123', '2026-2028', 1)
  `)

  sqlite.prepare(`
    INSERT INTO news (title, body, scope, status, published_at)
    VALUES 
    ('Welcome to the DYC Portal', 'We are excited to launch our new digital platform for the Diocese of Koforidua. This portal will serve as the central hub for all youth activities, events, and communications within our diocese.', 'diocese', 'published', datetime('now')),
    ('Diocesan Youth Congress 2026', 'Preparations are underway for the upcoming Diocesan Youth Congress scheduled for August 2026. All parishes are encouraged to participate.', 'diocese', 'published', datetime('now'))
  `)

  sqlite.prepare(`
    INSERT INTO events (title, description, event_type, scope, start_at, end_at, venue, status, registration_type)
    VALUES 
    ('Diocesan Youth Day 2026', 'Celebrating our faith and youth presence in the Diocese', 'rally', 'diocese', '2026-06-15 09:00:00', '2026-06-15 17:00:00', 'St. Joseph''s Cathedral, Koforidua', 'published', 'free'),
    ('Youth Retreat: Finding Peace in Christ', 'A day of reflection and spiritual renewal for all youth', 'retreat', 'deanery', '2026-05-20 08:00:00', '2026-05-20 18:00:00', 'St. Augustine''s Parish Hall', 'published', 'free')
  `)

  console.log('Database seeded successfully!')
  console.log('Default admin credentials:')
  console.log('  Email: admin@dyckoforidua.org')
  console.log('  Password: admin123')
}

seed().catch(console.error)
