import { drizzle } from 'drizzle-orm/d1'
import { hashPassword } from '../lib/auth'
import * as schema from './schema'

async function seed() {
  console.log('Seeding database...')

  const db = drizzle((globalThis as any).env.kofdyc_portal, { schema })
  const now = new Date()

  const existingUsers = await db.select().from(schema.user).limit(1)
  if (existingUsers.length > 0) {
    console.log('Database already seeded. Skipping...')
    return
  }

  const adminPassword = await hashPassword('admin123')
  const password = await hashPassword('password123')

  const adminId = crypto.randomUUID()
  const chaplainId = crypto.randomUUID()
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
      id: chaplainId,
      name: 'Fr. Emmanuel Asamoah',
      email: 'chaplain@dyckoforidua.org',
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      role: 'youth_chaplain',
      phone: '+233244234567',
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

  await db.insert(schema.account).values({
    id: crypto.randomUUID(),
    accountId: adminId,
    providerId: 'credential',
    userId: adminId,
    password: adminPassword,
    createdAt: now,
    updatedAt: now,
  })

  await db.insert(schema.account).values({
    id: crypto.randomUUID(),
    accountId: chaplainId,
    providerId: 'credential',
    userId: chaplainId,
    password: password,
    createdAt: now,
    updatedAt: now,
  })

  await db.insert(schema.account).values({
    id: crypto.randomUUID(),
    accountId: executiveId,
    providerId: 'credential',
    userId: executiveId,
    password: password,
    createdAt: now,
    updatedAt: now,
  })

  await db.insert(schema.account).values({
    id: crypto.randomUUID(),
    accountId: coordinatorId,
    providerId: 'credential',
    userId: coordinatorId,
    password: password,
    createdAt: now,
    updatedAt: now,
  })

  console.log('Users seeded successfully!')
  console.log('')
  console.log('Test accounts:')
  console.log('  Admin:     admin@dyckoforidua.org / admin123')
  console.log('  Chaplain:  chaplain@dyckoforidua.org / password123')
  console.log('  Executive: chairman@dyckoforidua.org / password123')
  console.log('  Coord:     coordinator@dyckoforidua.org / password123')
}

seed().catch(console.error)
