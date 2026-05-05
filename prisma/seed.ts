import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CLUBS } from "../src/lib/clubs";
import { PLAYERS } from "../src/lib/players";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "changeme123";
const ADMIN_EMAIL = "admin@starstrick.fc";

const usernameFromGamertag = (g: string) =>
  g.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_|_$/g, "").slice(0, 32);

const usernameFromName = (n: string) =>
  n.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_|_$/g, "").slice(0, 32);

const fakeEmail = (slug: string) => `${slug}@starstrick.local`;

function generateTag(name: string): string {
  const words = name.split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1].substring(0, 3)).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
  }
  return name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5);
}

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  // 1. ADMIN
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      username: "admin",
      email: ADMIN_EMAIL,
      passwordHash,
      role: "ADMIN",
      displayName: "Star Strick Admin",
      platform: "CROSSPLAY",
      country: "Zimbabwe",
    },
  });
  console.log(`✓ admin → ${ADMIN_EMAIL} / ${DEFAULT_PASSWORD}`);

  // 2. PLAYERS
  for (const p of PLAYERS) {
    const username = usernameFromGamertag(p.gamertag);
    await prisma.user.upsert({
      where: { username },
      update: { displayName: p.name, country: p.city, platform: "CROSSPLAY" },
      create: {
        username,
        email: fakeEmail(username),
        passwordHash,
        role: "PLAYER",
        displayName: p.name,
        country: p.city,
        platform: "CROSSPLAY",
      },
    });
    const playerUser = await prisma.user.findUniqueOrThrow({ where: { username } });
    await prisma.playerStats.upsert({
      where: { userId: playerUser.id },
      update: { matchesPlayed: p.wins + p.losses + p.draws, wins: p.wins, draws: p.draws, losses: p.losses, goalsScored: p.goalsFor, goalsAgainst: p.goalsAgainst, points: p.points, winStreak: p.winStreak, skillRating: 1000 + p.points },
      create: { userId: playerUser.id, matchesPlayed: p.wins + p.losses + p.draws, wins: p.wins, draws: p.draws, losses: p.losses, goalsScored: p.goalsFor, goalsAgainst: p.goalsAgainst, points: p.points, winStreak: p.winStreak, skillRating: 1000 + p.points },
    });
    await prisma.playerRanking.upsert({
      where: { userId: playerUser.id },
      update: { rankPosition: p.rank, prevPosition: p.prev, rankChange: p.prev - p.rank, points: p.points },
      create: { userId: playerUser.id, rankPosition: p.rank, prevPosition: p.prev, rankChange: p.prev - p.rank, points: p.points },
    });
  }
  console.log(`✓ players → ${PLAYERS.length} seeded`);

  // 3. MANAGERS
  const managerByClubId = new Map<string, { id: string; username: string }>();
  for (const c of CLUBS) {
    const username = usernameFromName(c.manager);
    const user = await prisma.user.upsert({
      where: { username },
      update: { role: "MANAGER", displayName: c.manager, country: c.city },
      create: { username, email: fakeEmail(username), passwordHash, role: "MANAGER", displayName: c.manager, country: c.city, platform: "CROSSPLAY" },
      select: { id: true, username: true },
    });
    managerByClubId.set(c.id, user);
  }
  console.log(`✓ managers → ${CLUBS.length} accounts`);

  // 4. CLUBS + GLOBAL RANKINGS
  for (const c of CLUBS) {
    const manager = managerByClubId.get(c.id)!;
    const tag = generateTag(c.name);
    await prisma.club.upsert({
      where: { name: c.name },
      update: { tag, city: c.city, country: "Zimbabwe", createdByUserId: manager.id, globalRanking: { upsert: { create: { rankPosition: c.rank, prevPosition: c.prev, totalPoints: c.points, played: c.played, wins: c.wins, draws: c.draws, losses: c.losses, goalsFor: c.goalsFor, goalsAgainst: c.goalsAgainst }, update: { rankPosition: c.rank, prevPosition: c.prev, totalPoints: c.points, played: c.played, wins: c.wins, draws: c.draws, losses: c.losses, goalsFor: c.goalsFor, goalsAgainst: c.goalsAgainst } } } },
      create: { name: c.name, tag, city: c.city, country: "Zimbabwe", createdByUserId: manager.id, globalRanking: { create: { rankPosition: c.rank, prevPosition: c.prev, totalPoints: c.points, played: c.played, wins: c.wins, draws: c.draws, losses: c.losses, goalsFor: c.goalsFor, goalsAgainst: c.goalsAgainst } } },
    });
  }
  console.log(`✓ clubs → ${CLUBS.length} with global rankings`);

  // 5. CLUB MEMBERSHIPS + INTERNAL RANKINGS
  let totalMemberships = 0;
  for (const c of CLUBS) {
    const club = await prisma.club.findUniqueOrThrow({ where: { name: c.name } });
    let pos = 1;
    for (const playerId of c.playerIds) {
      const player = PLAYERS.find((p) => p.id === playerId);
      if (!player) continue;
      const playerUser = await prisma.user.findUnique({ where: { username: usernameFromGamertag(player.gamertag) } });
      if (!playerUser) continue;
      await prisma.clubMember.upsert({ where: { userId_clubId: { userId: playerUser.id, clubId: club.id } }, update: { status: "APPROVED" }, create: { userId: playerUser.id, clubId: club.id, role: "PLAYER", status: "APPROVED" } });
      await prisma.clubRanking.upsert({ where: { clubId_userId: { clubId: club.id, userId: playerUser.id } }, update: { rankPosition: pos, points: player.points }, create: { clubId: club.id, userId: playerUser.id, rankPosition: pos, points: player.points } });
      pos++;
      totalMemberships++;
    }
  }
  console.log(`✓ members → ${totalMemberships} memberships + internal rankings`);
  console.log("\nSeeded successfully.\n");
  console.log(`Admin login → email: ${ADMIN_EMAIL}  password: ${DEFAULT_PASSWORD}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
