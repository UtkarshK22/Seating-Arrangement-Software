import { PrismaClient, OrgRole } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  // =====================================================
  // 1️⃣ CREATE ORGANIZATION
  // =====================================================

  const organization = await prisma.organization.upsert({
    where: { slug: 'demo-org' },
    update: {},
    create: {
      name: 'Demo Organization',
      slug: 'demo-org',
    },
  })

  // =====================================================
  // 2️⃣ CREATE USERS
  // =====================================================

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      passwordHash,
      fullName: 'Demo Admin',
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@demo.com' },
    update: {},
    create: {
      email: 'user@demo.com',
      passwordHash,
      fullName: 'Demo User',
    },
  })

  // =====================================================
  // 3️⃣ ATTACH ROLES
  // =====================================================

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
  // 4️⃣ CREATE BUILDING
  // =====================================================

  const building = await prisma.building.upsert({
    where: { id: 'demo-building-id' },
    update: {},
    create: {
      id: 'demo-building-id',
      name: 'HQ Building',
      organizationId: organization.id,
    },
  })

  // =====================================================
  // 5️⃣ CREATE FLOOR
  // =====================================================

  const floorWidth = 1000
  const floorHeight = 600

  const floor = await prisma.floor.upsert({
    where: { id: 'demo-floor-id' },
    update: {},
    create: {
      id: 'demo-floor-id',
      name: 'First Floor',
      buildingId: building.id,
      imageUrl: 'https://via.placeholder.com/1000x600',
      width: floorWidth,
      height: floorHeight,
    },
  })

  // =====================================================
  // 6️⃣ CREATE SEATS (SPATIAL CORE)
  // =====================================================

  await prisma.seat.deleteMany({
    where: {
      floorId: floor.id,
    },
  })

  const seatCount = 15
  const defaultSeatWidth = 40
  const defaultSeatHeight = 40

  for (let i = 1; i <= seatCount; i++) {
    await prisma.seat.create({
      data: {
        seatCode: `S-${i}`,
        floorId: floor.id,
        isLocked: false,

        // === Spatial Fields ===
        posX: Math.random() * (floorWidth - defaultSeatWidth),
        posY: Math.random() * (floorHeight - defaultSeatHeight),
        rotation: 0,
        scale: 1,
        width: defaultSeatWidth,
        height: defaultSeatHeight,
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