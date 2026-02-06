import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.$executeRawUnsafe(`
    UPDATE "ExportLog"
    SET "s3Key" =
      'legacy/' || "organizationId" || '/' || EXTRACT(EPOCH FROM "exportedAt")::bigint || '.csv'
    WHERE "s3Key" IS NULL
  `);

  console.log('Backfill completed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
