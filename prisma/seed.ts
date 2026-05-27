import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@zimfcpro.zw";
const ADMIN_PASSWORD = "changeme123";

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      username: "admin",
      email: ADMIN_EMAIL,
      passwordHash,
      role: "ADMIN",
      displayName: "ZIMFC Admin",
      platform: "CROSSPLAY",
      country: "Zimbabwe",
      isVerified: true,
      onboardingComplete: true,
    },
  });

  console.log(`\n=============================================`);
  console.log(`  ZIMFC Pro — Season 1 Fresh Start`);
  console.log(`=============================================`);
  console.log(`\nAdmin login:  ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`\nSign up at the website to create your player account.`);
  console.log(`All rankings start fresh — no fake data.\n`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());