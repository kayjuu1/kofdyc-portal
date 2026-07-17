import { drizzle } from 'drizzle-orm/d1'
import { hashPassword } from '../lib/auth'
import { slugify } from '../lib/hierarchy-rules'
import * as schema from './schema'

type SeedDb = ReturnType<typeof drizzle<typeof schema>>

async function seedUsers(db: SeedDb, now: Date) {
  const existingUsers = await db.select().from(schema.user).limit(1)
  if (existingUsers.length > 0) {
    console.log('Users already seeded. Skipping...')
    return
  }

  const adminPassword = await hashPassword('admin123')
  const password = await hashPassword('password123')

  const adminId = crypto.randomUUID()
  const executiveId = crypto.randomUUID()
  const coordinatorId = crypto.randomUUID()

  await db.insert(schema.user).values([
    {
      id: adminId,
      name: 'ICT Administrator',
      email: 'admin@dyckoforidua.org',
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      role: 'system_admin',
      phone: '+233244123456',
      isActive: true,
      banned: false,
    },
    {
      id: executiveId,
      name: 'Kojo Mensah',
      email: 'chairman@dyckoforidua.org',
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      role: 'diocesan_executive',
      phone: '+233244345678',
      isActive: true,
      banned: false,
    },
    {
      id: coordinatorId,
      name: 'Kwame Antwi',
      email: 'coordinator@dyckoforidua.org',
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      role: 'coordinator',
      phone: '+233244456789',
      isActive: true,
      banned: false,
    },
  ])

  const credentials: Array<[string, string]> = [
    [adminId, adminPassword],
    [executiveId, password],
    [coordinatorId, password],
  ]
  for (const [userId, hashed] of credentials) {
    await db.insert(schema.account).values({
      id: crypto.randomUUID(),
      accountId: userId,
      providerId: 'credential',
      userId,
      password: hashed,
      createdAt: now,
      updatedAt: now,
    })
  }

  console.log('Users seeded successfully!')
  console.log('')
  console.log('Test accounts:')
  console.log('  Admin:     admin@dyckoforidua.org / admin123')
  console.log('  Executive: chairman@dyckoforidua.org / password123')
  console.log('  Coord:     coordinator@dyckoforidua.org / password123')
}

async function seedFeaturedEvents(db: SeedDb, nowIso: string) {
  const existing = await db.select().from(schema.featuredEvents).limit(1)
  if (existing.length > 0) {
    console.log('Featured events already seeded. Skipping...')
    return
  }

  await db.insert(schema.featuredEvents).values({
    displayTitle: 'West Africa Youth Days · Accra 2026',
    artworkUrl: '/api/media/uploads/seed-featured-placeholder.jpg',
    targetDate: '2026-12-01T09:00:00.000Z',
    ctaLabel: 'Event details',
    ctaUrl: 'https://example.org/wayd-2026',
    supportLine: 'Dial ***713*8534#** and select Option 1 to support the hosting of WAYD 2026.',
    isActive: false,
    sortOrder: 0,
    createdAt: nowIso,
    updatedAt: nowIso,
  })

  console.log('Featured event placeholder seeded (inactive).')
}

async function seedLeadership(db: SeedDb, nowIso: string) {
  const existing = await db.select().from(schema.leadershipGroups).limit(1)
  if (existing.length > 0) {
    console.log('Leadership already seeded. Skipping...')
    return
  }

  const [group] = await db
    .insert(schema.leadershipGroups)
    .values({
      title: 'The Diocesan|Executive Council',
      eyebrow: 'EXECUTIVES',
      intro: 'The leaders serving the youth of the Catholic Diocese of Koforidua.',
      sortOrder: 0,
      isPublished: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    })
    .returning()

  await db.insert(schema.leadershipMembers).values([
    {
      groupId: group.id,
      name: 'Fr. Emmanuel Asamoah',
      roleTitle: 'Diocesan Youth Chaplain',
      photoUrl: null,
      bio: 'Placeholder biography.',
      sortOrder: 0,
      isPublished: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      groupId: group.id,
      name: 'Kojo Mensah',
      roleTitle: 'Chairman',
      photoUrl: null,
      bio: 'Placeholder biography.',
      sortOrder: 1,
      isPublished: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      groupId: group.id,
      name: 'Ama Serwaa',
      roleTitle: 'Secretary',
      photoUrl: null,
      bio: 'Placeholder biography.',
      sortOrder: 2,
      isPublished: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ])

  console.log('Leadership group + 3 members seeded (unpublished).')
}

async function seedHierarchy(db: SeedDb, nowIso: string) {
  const existing = await db.select().from(schema.hierarchyNodes).limit(1)
  if (existing.length > 0) {
    console.log('Hierarchy already seeded. Skipping...')
    return
  }

  const [cym] = await db
    .insert(schema.hierarchyNodes)
    .values({
      type: 'movement',
      name: 'Catholic Youth Movement',
      slug: 'catholic-youth-movement',
      briefHistory: 'Placeholder history for the Catholic Youth Movement.',
      sortOrder: 0,
      isPublished: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    })
    .returning()

  await db.insert(schema.hierarchyNodes).values({
    type: 'movement',
    name: 'Knights of the Altar',
    slug: 'knights-of-the-altar',
    briefHistory: 'Placeholder history for the Knights of the Altar.',
    sortOrder: 1,
    isPublished: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  })

  await db.insert(schema.hierarchyNodes).values({
    parentId: cym.id,
    type: 'sub_movement',
    name: 'CYM Choir',
    slug: 'cym-choir',
    briefHistory: 'Placeholder history for the CYM Choir.',
    sortOrder: 0,
    isPublished: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  })

  // Auto-create council nodes from existing deaneries/parishes (no-op on empty DB)
  const allDeaneries = await db.select().from(schema.deaneries)
  const allParishes = await db.select().from(schema.parishes)
  let councils = 0

  // Deanery/parish names are not unique (e.g. the same patron saint in two
  // deaneries), but hierarchy_nodes.slug is — suffix duplicates with -2, -3, …
  const usedSlugs = new Set<string>(['catholic-youth-movement', 'knights-of-the-altar', 'cym-choir'])
  function uniqueSlug(base: string): string {
    let slug = base
    for (let n = 2; usedSlugs.has(slug); n++) slug = `${base}-${n}`
    usedSlugs.add(slug)
    return slug
  }

  for (const [index, deanery] of allDeaneries.entries()) {
    const [councilNode] = await db
      .insert(schema.hierarchyNodes)
      .values({
        type: 'deanery_council',
        name: `${deanery.name} Deanery Youth Council`,
        slug: uniqueSlug(`${slugify(deanery.name)}-deanery-council`),
        deaneryId: deanery.id,
        sortOrder: index,
        isPublished: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      .returning()
    councils++

    const deaneryParishes = allParishes.filter((parish) => parish.deaneryId === deanery.id)
    for (const [parishIndex, parish] of deaneryParishes.entries()) {
      await db.insert(schema.hierarchyNodes).values({
        parentId: councilNode.id,
        type: 'parish_council',
        name: `${parish.name} Parish Youth Council`,
        slug: uniqueSlug(`${slugify(parish.name)}-parish-council`),
        parishId: parish.id,
        sortOrder: parishIndex,
        isPublished: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      })
      councils++
    }
  }

  console.log(
    `Hierarchy seeded: 2 movements, 1 sub-movement, ${councils} council nodes (all unpublished).`,
  )
}

async function seed() {
  console.log('Seeding database...')

  const db = drizzle((globalThis as any).env.kofdyc_portal, { schema })
  const now = new Date()
  const nowIso = now.toISOString()

  await seedUsers(db, now)
  await seedFeaturedEvents(db, nowIso)
  await seedLeadership(db, nowIso)
  await seedHierarchy(db, nowIso)

  console.log('Seeding complete.')
}

seed().catch(console.error)
