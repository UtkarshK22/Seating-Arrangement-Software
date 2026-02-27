import { PrismaClient, OrgRole } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  // 1️⃣ Create Organization
  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
    },
  })

  // 2️⃣ Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      passwordHash,
      fullName: 'Demo Admin',
    },
  })

  // 3️⃣ Create Normal User
  const user = await prisma.user.upsert({
    where: { email: 'user@demo.com' },
    update: {},
    create: {
      email: 'user@demo.com',
      passwordHash,
      fullName: 'Demo User',
    },
  })

  // 4️⃣ Attach Roles via OrganizationMember
  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: admin.id,
        organizationId: organization.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      organizationId: organization.id,
      role: OrgRole.ADMIN,
    },
  })

  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      organizationId: organization.id,
      role: OrgRole.EMPLOYEE,
    },
  })

  // =====================================================
  // 5️⃣ CREATE BUILDING (REQUIRED FOR FLOOR ACCESS)
  // =====================================================

  const building = await prisma.building.upsert({
    where: { id: 'demo-building-id' }, // fixed id for repeatable seed
    update: {},
    create: {
      id: 'demo-building-id',
      name: 'HQ Building',
      organizationId: organization.id,
    },
  })

  // =====================================================
  // 6️⃣ CREATE FLOOR
  // =====================================================

  const floor = await prisma.floor.upsert({
    where: { id: 'demo-floor-id' },
    update: {},
    create: {
      id: 'demo-floor-id',
      name: 'First Floor',
      buildingId: building.id,
      imageUrl: 'https://via.placeholder.com/1000x600',
      width: 1000,
      height: 600,
    },
  })

  // =====================================================
  // 7️⃣ CREATE SEATS
  // =====================================================

  // Delete existing seats for this floor (so seed is repeatable)
  await prisma.seat.deleteMany({
    where: {
      floorId: floor.id,
    },
  })

  const seatCount = 15

  for (let i = 1; i <= seatCount; i++) {
    await prisma.seat.create({
      data: {
        seatCode: `S-${i}`,
        x: Math.random(),
        y: Math.random(),
        floorId: floor.id,
        isLocked: false,
      },
    })
  }

  console.log('✅ Seed completed successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })