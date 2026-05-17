import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = "changeme123";
const ADMIN_EMAIL = "admin@starstrick.fc";

const fakeEmail = (slug: string) => `${slug}@zimfc.local`;

const SLUG = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

interface ClubSeed {
  name: string;
  tagline: string;
  tag: string;
  city: string;
  manager: string;
  rank: number;
  prev: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  clubXp: number;
  featuredLegends: string[];
  description: string;
  joinCode: string;
  players: { gamertag: string; name: string; role: string; points: number; wins: number; losses: number; draws: number; goalsFor: number; goalsAgainst: number }[];
  rivalries: string[];
  achievements: { title: string; description: string; icon: string }[];
}

const CLUBS: ClubSeed[] = [
  {
    name: "Game Nation",
    tagline: "The apex gaming hub housing the absolute best players in the meta right now.",
    tag: "GN",
    city: "Harare",
    manager: "Tafadzwa Gumbo",
    rank: 1,
    prev: 1,
    played: 48,
    wins: 38,
    draws: 5,
    losses: 5,
    goalsFor: 142,
    goalsAgainst: 38,
    clubXp: 98400,
    featuredLegends: ["Footello", "AshMar", "KingKundai"],
    description: "The most dominant club in ZIMFC history. Game Nation houses the absolute best players in the meta right now. Multiple championship titles, highest XP, and a legacy of excellence.",
    joinCode: "GN_ELITE",
    players: [
      { gamertag: "Footello", name: "Tendai Foote", role: "LEGEND", points: 2840, wins: 142, losses: 18, draws: 8, goalsFor: 412, goalsAgainst: 89 },
      { gamertag: "AshMar", name: "Ashley Marumaboko", role: "LEGEND", points: 2710, wins: 135, losses: 22, draws: 11, goalsFor: 389, goalsAgainst: 102 },
      { gamertag: "KingKundai", name: "Kundai Gumbo", role: "LEGEND", points: 2650, wins: 131, losses: 24, draws: 13, goalsFor: 378, goalsAgainst: 110 },
      { gamertag: "Prodigy_ZW", name: "Simba Madzima", role: "PRO", points: 2340, wins: 112, losses: 30, draws: 16, goalsFor: 321, goalsAgainst: 145 },
      { gamertag: "Nexus_zw", name: "Tanaka Chigumira", role: "PRO", points: 2180, wins: 104, losses: 35, draws: 19, goalsFor: 298, goalsAgainst: 162 },
      { gamertag: "ByteMe_zw", name: "Rudo Moyo", role: "MEMBER", points: 1890, wins: 88, losses: 42, draws: 28, goalsFor: 245, goalsAgainst: 198 },
    ],
    rivalries: ["GameStop"],
    achievements: [
      { title: "Season 1 Champions", description: "Won the inaugural ZIMFC Pro League", icon: "🏆" },
      { title: "Triple Crown", description: "Won League + Cup + Knockout in one season", icon: "👑" },
      { title: "Undefeated Season", description: "Completed a full season without a single loss", icon: "💎" },
      { title: "100 Wins Club", description: "First club to reach 100 competitive wins", icon: "🔥" },
    ],
  },
  {
    name: "GameStop",
    tagline: "The relentless challengers fighting for the throne.",
    tag: "GS",
    city: "Bulawayo",
    manager: "Bhekumuzi Ndlovu",
    rank: 2,
    prev: 2,
    played: 48,
    wins: 33,
    draws: 7,
    losses: 8,
    goalsFor: 118,
    goalsAgainst: 52,
    clubXp: 87200,
    featuredLegends: ["Venom_zw", "Savage_zw"],
    description: "The relentless challengers fighting for the throne. GameStop has been the closest rival to Game Nation, consistently pushing them to the limit in every competition.",
    joinCode: "GS_WARRIORS",
    players: [
      { gamertag: "Venom_zw", name: "Takudzwa Hove", role: "LEGEND", points: 2580, wins: 128, losses: 26, draws: 14, goalsFor: 365, goalsAgainst: 118 },
      { gamertag: "Savage_zw", name: "Tafadzwa Mhlanga", role: "LEGEND", points: 2490, wins: 122, losses: 30, draws: 16, goalsFor: 351, goalsAgainst: 132 },
      { gamertag: "Blaze_zw", name: "Tanaka Zvirevo", role: "PRO", points: 2260, wins: 108, losses: 36, draws: 14, goalsFor: 305, goalsAgainst: 168 },
      { gamertag: "FrostByte", name: "Nyasha Dube", role: "PRO", points: 2120, wins: 100, losses: 40, draws: 18, goalsFor: 278, goalsAgainst: 185 },
      { gamertag: "Shadow_zw", name: "Kudzai Moyo", role: "MEMBER", points: 1840, wins: 84, losses: 48, draws: 26, goalsFor: 234, goalsAgainst: 215 },
    ],
    rivalries: ["Game Nation"],
    achievements: [
      { title: "Season 2 Champions", description: "Won the ZIMFC Pro League Season 2", icon: "🏆" },
      { title: "Best Defense Award", description: "Fewest goals conceded in Season 3", icon: "🛡️" },
      { title: "50 Clean Sheets", description: "Achieved 50 clean sheets as a club", icon: "🧤" },
    ],
  },
  {
    name: "Tiffo Gaming",
    tagline: "Built for pure competition and elite mechanics.",
    tag: "TG",
    city: "Mutare",
    manager: "Edmore Chimombe",
    rank: 3,
    prev: 4,
    played: 48,
    wins: 30,
    draws: 8,
    losses: 10,
    goalsFor: 104,
    goalsAgainst: 62,
    clubXp: 76800,
    featuredLegends: ["KillerBee", "Ghost_zw"],
    description: "Built for pure competition and elite mechanics. Tiffo Gaming is known for producing some of the most technically gifted players in the ZIMFC circuit.",
    joinCode: "TIFFO_ELITE",
    players: [
      { gamertag: "KillerBee", name: "Tafadzwa Betera", role: "LEGEND", points: 2410, wins: 118, losses: 32, draws: 18, goalsFor: 334, goalsAgainst: 148 },
      { gamertag: "Ghost_zw", name: "Simba Chakanyuka", role: "LEGEND", points: 2320, wins: 112, losses: 36, draws: 20, goalsFor: 318, goalsAgainst: 162 },
      { gamertag: "Eclipse_ZW", name: "Munyaradzi Gumbo", role: "PRO", points: 2080, wins: 96, losses: 42, draws: 20, goalsFor: 268, goalsAgainst: 195 },
      { gamertag: "Rogue_One", name: "Tapiwa Makoni", role: "MEMBER", points: 1760, wins: 78, losses: 52, draws: 28, goalsFor: 215, goalsAgainst: 232 },
    ],
    rivalries: ["Zumba Gaming"],
    achievements: [
      { title: "Mechanical Kings", description: "Awarded for highest average skill rating", icon: "⚡" },
      { title: "Knockout Cup Winners", description: "Won the ZIMFC Knockout Cup Season 3", icon: "🏆" },
      { title: "Most Goals in a Season", description: "Scored the most goals in a single campaign", icon: "🎯" },
    ],
  },
  {
    name: "Zumba Gaming",
    tagline: "Where local talent evolves into elite competitors.",
    tag: "ZG",
    city: "Harare",
    manager: "Memory Maposa",
    rank: 4,
    prev: 5,
    played: 48,
    wins: 26,
    draws: 10,
    losses: 12,
    goalsFor: 92,
    goalsAgainst: 68,
    clubXp: 65400,
    featuredLegends: ["RisingStar", "Maposa_zw"],
    description: "Where local talent evolves into elite competitors. Zumba Gaming has the largest active community and is known for developing raw talent into championship-caliber players.",
    joinCode: "ZG_FAMILY",
    players: [
      { gamertag: "RisingStar", name: "Tanaka Chikwanha", role: "LEGEND", points: 2180, wins: 104, losses: 38, draws: 16, goalsFor: 292, goalsAgainst: 178 },
      { gamertag: "Maposa_zw", name: "Memory Maposa Jr", role: "CAPTAIN", points: 2050, wins: 96, losses: 42, draws: 20, goalsFor: 275, goalsAgainst: 195 },
      { gamertag: "Nova_zw", name: "Rutendo Moyo", role: "PRO", points: 1890, wins: 86, losses: 48, draws: 24, goalsFor: 242, goalsAgainst: 212 },
      { gamertag: "Hustler_ZW", name: "Blessing Dube", role: "MEMBER", points: 1650, wins: 72, losses: 56, draws: 30, goalsFor: 198, goalsAgainst: 248 },
      { gamertag: "Vibe_zw", name: "Tinashe Gumbo", role: "RECRUIT", points: 1420, wins: 58, losses: 62, draws: 38, goalsFor: 168, goalsAgainst: 278 },
      { gamertag: "Fresh_zw", name: "Nyasha Mufakose", role: "RECRUIT", points: 1280, wins: 48, losses: 68, draws: 42, goalsFor: 145, goalsAgainst: 298 },
    ],
    rivalries: ["Tiffo Gaming"],
    achievements: [
      { title: "Community Award", description: "Largest active member base for 3 consecutive seasons", icon: "🌟" },
      { title: "Best Development Program", description: "Produced the most Rookie of the Year winners", icon: "📈" },
      { title: "Fair Play Award", description: "Lowest disciplinary record across all competitions", icon: "🤝" },
    ],
  },
  {
    name: "Apex Arena",
    tagline: "The underground battleground of future champions.",
    tag: "AA",
    city: "Chitungwiza",
    manager: "Dumisani Mavhunga",
    rank: 5,
    prev: 6,
    played: 48,
    wins: 22,
    draws: 12,
    losses: 14,
    goalsFor: 82,
    goalsAgainst: 74,
    clubXp: 56200,
    featuredLegends: ["Predator_zw"],
    description: "The underground battleground of future champions. Apex Arena may not have the biggest name, but they consistently produce dark horse contenders who shake up the rankings.",
    joinCode: "APEX_COMBAT",
    players: [
      { gamertag: "Predator_zw", name: "Tafara Marumahoko", role: "LEGEND", points: 2010, wins: 94, losses: 44, draws: 20, goalsFor: 268, goalsAgainst: 202 },
      { gamertag: "Stealth_zw", name: "Kudakwashe Muzinda", role: "PRO", points: 1820, wins: 82, losses: 50, draws: 26, goalsFor: 232, goalsAgainst: 228 },
      { gamertag: "Wraith_zw", name: "Anashe Gumbo", role: "MEMBER", points: 1580, wins: 68, losses: 58, draws: 32, goalsFor: 188, goalsAgainst: 258 },
    ],
    rivalries: [],
    achievements: [
      { title: "Dark Horse Champions", description: "Won the knockout cup as the lowest seed", icon: "⚔️" },
      { title: "Most Improved Club", description: "Biggest rank jump between seasons", icon: "📊" },
    ],
  },
  {
    name: "Harare Mavericks",
    tagline: "Fearless play. Ruthless execution.",
    tag: "HM",
    city: "Harare",
    manager: "Tichaona Madziva",
    rank: 6,
    prev: 7,
    played: 48,
    wins: 18,
    draws: 14,
    losses: 16,
    goalsFor: 72,
    goalsAgainst: 82,
    clubXp: 47800,
    featuredLegends: [],
    description: "Fearless play. Ruthless execution. The Mavericks bring an aggressive, no-holds-barred style of play that makes them dangerous opponents on any given day.",
    joinCode: "MAVERICK_ZW",
    players: [
      { gamertag: "Rebel_zw", name: "Tawanda Machipisa", role: "CAPTAIN", points: 1750, wins: 78, losses: 52, draws: 28, goalsFor: 225, goalsAgainst: 235 },
      { gamertag: "WildCard", name: "Munashe Makoni", role: "MEMBER", points: 1520, wins: 64, losses: 60, draws: 34, goalsFor: 182, goalsAgainst: 262 },
      { gamertag: "Outlaw_zw", name: "Takunda Sithole", role: "MEMBER", points: 1380, wins: 54, losses: 66, draws: 38, goalsFor: 158, goalsAgainst: 288 },
    ],
    rivalries: [],
    achievements: [
      { title: "Giant Slayers", description: "Defeated the #1 ranked club twice in one season", icon: "🦁" },
    ],
  },
  {
    name: "Velocity FC Esports",
    tagline: "Fast gameplay. Faster domination.",
    tag: "VFC",
    city: "Gweru",
    manager: "Sipho Mlilo",
    rank: 7,
    prev: 8,
    played: 48,
    wins: 14,
    draws: 16,
    losses: 18,
    goalsFor: 62,
    goalsAgainst: 92,
    clubXp: 38400,
    featuredLegends: [],
    description: "Fast gameplay. Faster domination. Velocity FC Esports is known for their lightning-fast playstyle and rapid counter-attacks that catch opponents off guard.",
    joinCode: "VELOCITY_ZW",
    players: [
      { gamertag: "Turbo_zw", name: "Tapiwa Zindoga", role: "CAPTAIN", points: 1620, wins: 70, losses: 56, draws: 32, goalsFor: 205, goalsAgainst: 248 },
      { gamertag: "RapidFire", name: "Simbarashe Muroiwa", role: "MEMBER", points: 1410, wins: 56, losses: 64, draws: 38, goalsFor: 168, goalsAgainst: 278 },
      { gamertag: "Swift_zw", name: "Tadiwanashe Gumbo", role: "RECRUIT", points: 1180, wins: 42, losses: 72, draws: 44, goalsFor: 132, goalsAgainst: 312 },
    ],
    rivalries: [],
    achievements: [
      { title: "Fastest Goal Record", description: "Scored the fastest goal in ZIMFC history (18 seconds)", icon: "⏱️" },
      { title: "Spirit of ZIMFC", description: "Awarded for sportsmanship and community engagement", icon: "🤝" },
    ],
  },
];

const usernameFromName = (n: string) =>
  n.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_|_$/g, "").slice(0, 32);

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
      displayName: "ZIMFC Admin",
      platform: "CROSSPLAY",
      country: "Zimbabwe",
    },
  });
  console.log(`✓ admin → ${ADMIN_EMAIL} / ${DEFAULT_PASSWORD}`);

  // 2. PLAYERS + MANAGERS + CLUBS
  let totalPlayers = 0;
  let totalMemberships = 0;

  for (const c of CLUBS) {
    // Create manager
    const managerUsername = usernameFromName(c.manager);
    const manager = await prisma.user.upsert({
      where: { username: managerUsername },
      update: { role: "MANAGER", displayName: c.manager, country: c.city },
      create: {
        username: managerUsername,
        email: fakeEmail(managerUsername),
        passwordHash,
        role: "MANAGER",
        displayName: c.manager,
        country: c.city,
        platform: "CROSSPLAY",
      },
      select: { id: true, username: true },
    });

    // Create or get players
    const playerIds: string[] = [];
    for (const p of c.players) {
      const username = usernameFromName(p.gamertag);
      const user = await prisma.user.upsert({
        where: { username },
        update: { displayName: p.name, country: c.city, platform: "CROSSPLAY" },
        create: {
          username,
          email: fakeEmail(username),
          passwordHash,
          role: "PLAYER",
          displayName: p.name,
          country: c.city,
          platform: "CROSSPLAY",
        },
        select: { id: true },
      });

      await prisma.playerStats.upsert({
        where: { userId: user.id },
        update: {
          matchesPlayed: p.wins + p.losses + p.draws,
          wins: p.wins,
          draws: p.draws,
          losses: p.losses,
          goalsScored: p.goalsFor,
          goalsConceded: p.goalsAgainst,
          points: p.points,
          skillRating: 1000 + p.points,
        },
        create: {
          userId: user.id,
          matchesPlayed: p.wins + p.losses + p.draws,
          wins: p.wins,
          draws: p.draws,
          losses: p.losses,
          goalsScored: p.goalsFor,
          goalsConceded: p.goalsAgainst,
          points: p.points,
          skillRating: 1000 + p.points,
        },
      });

      await prisma.playerRanking.upsert({
        where: { userId: user.id },
        update: {
          rankPosition: totalPlayers + 1,
          prevPosition: totalPlayers + 2,
          rankChange: 1,
          points: p.points,
        },
        create: {
          userId: user.id,
          rankPosition: totalPlayers + 1,
          prevPosition: totalPlayers + 2,
          rankChange: 1,
          points: p.points,
        },
      });

      playerIds.push(user.id);
      totalPlayers++;
    }

    console.log(`  ✓ ${c.name}: ${c.players.length} players created`);

    // Create club
    const slug = SLUG(c.name);
    const club = await prisma.club.upsert({
      where: { name: c.name },
      update: {
        tag: c.tag,
        tagline: c.tagline,
        slug,
        city: c.city,
        country: "Zimbabwe",
        description: c.description,
        clubXp: c.clubXp,
        winRate: c.played > 0 ? Math.round((c.wins / c.played) * 10000) / 100 : 0,
        featuredLegends: JSON.stringify(c.featuredLegends),
        joinCode: c.joinCode,
        isPublic: true,
        status: "APPROVED",
        createdBy: { connect: { id: manager.id } },
      },
      create: {
        name: c.name,
        tag: c.tag,
        tagline: c.tagline,
        slug,
        city: c.city,
        country: "Zimbabwe",
        description: c.description,
        clubXp: c.clubXp,
        winRate: c.played > 0 ? Math.round((c.wins / c.played) * 10000) / 100 : 0,
        featuredLegends: JSON.stringify(c.featuredLegends),
        joinCode: c.joinCode,
        isPublic: true,
        status: "APPROVED",
        manager: { connect: { id: manager.id } },
        createdBy: { connect: { id: manager.id } },
      },
      select: { id: true },
    });

    // Global club ranking
    await prisma.globalClubRanking.upsert({
      where: { clubId: club.id },
      update: {
        rankPosition: c.rank,
        prevPosition: c.prev,
        totalPoints: c.clubXp,
        played: c.played,
        wins: c.wins,
        draws: c.draws,
        losses: c.losses,
        goalsFor: c.goalsFor,
        goalsAgainst: c.goalsAgainst,
        momentum: 80 + (CLUBS.length - c.rank) * 3,
      },
      create: {
        clubId: club.id,
        rankPosition: c.rank,
        prevPosition: c.prev,
        totalPoints: c.clubXp,
        played: c.played,
        wins: c.wins,
        draws: c.draws,
        losses: c.losses,
        goalsFor: c.goalsFor,
        goalsAgainst: c.goalsAgainst,
        momentum: 80 + (CLUBS.length - c.rank) * 3,
      },
    });

    // Club memberships + internal rankings
    let pos = 1;
    for (let i = 0; i < c.players.length; i++) {
      const p = c.players[i];
      const username = usernameFromName(p.gamertag);
      const user = await prisma.user.findUnique({ where: { username }, select: { id: true } });
      if (!user) continue;

      const role = p.role;

      await prisma.clubMember.upsert({
        where: { userId_clubId: { userId: user.id, clubId: club.id } },
        update: { role, clubXp: p.points, status: "APPROVED" },
        create: {
          userId: user.id,
          clubId: club.id,
          role,
          clubXp: p.points,
          status: "APPROVED",
        },
      });

      await prisma.clubRanking.upsert({
        where: { clubId_userId: { clubId: club.id, userId: user.id } },
        update: { rankPosition: pos, points: p.points },
        create: { clubId: club.id, userId: user.id, rankPosition: pos, points: p.points },
      });

      // Link user to club
      await prisma.user.update({
        where: { id: user.id },
        data: { clubId: club.id, joinedClubAt: new Date() },
      });

      pos++;
      totalMemberships++;
    }

    // Link manager as club member with OWNER role
    await prisma.clubMember.upsert({
      where: { userId_clubId: { userId: manager.id, clubId: club.id } },
      update: { role: "OWNER", status: "APPROVED" },
      create: {
        userId: manager.id,
        clubId: club.id,
        role: "OWNER",
        status: "APPROVED",
      },
    });

    // Club achievements
    for (const a of c.achievements) {
      const existing = await prisma.clubAchievement.findFirst({
        where: { clubId: club.id, title: a.title },
      });
      if (!existing) {
        await prisma.clubAchievement.create({
          data: {
            clubId: club.id,
            title: a.title,
            description: a.description,
            icon: a.icon,
            earnedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    // Initial activity entries
    const activityMessages = [
      { type: "CLUB_CREATED", message: `${c.name} was founded and approved for competition` },
      { type: "ACHIEVEMENT", message: `New achievement unlocked: ${c.achievements[0]?.title || "First Win"}` },
      { type: "MEMBER_JOINED", message: `${c.players[0].name} joined as ${c.players[0].role}` },
    ];

    for (const act of activityMessages) {
      await prisma.clubActivity.create({
        data: {
          clubId: club.id,
          userId: manager.id,
          type: act.type,
          message: act.message,
          metadata: {},
        },
      });
    }
  }

  console.log(`\n✓ ${CLUBS.length} clubs seeded with global rankings`);
  console.log(`✓ ${totalPlayers} players + ${CLUBS.length} managers`);
  console.log(`✓ ${totalMemberships} memberships + internal rankings`);

  // Rivalries
  for (const c of CLUBS) {
    if (c.rivalries.length === 0) continue;
    const club1 = await prisma.club.findUnique({ where: { name: c.name }, select: { id: true } });
    if (!club1) continue;

    for (const rivalName of c.rivalries) {
      const club2 = await prisma.club.findUnique({ where: { name: rivalName }, select: { id: true } });
      if (!club2) continue;

      const sorted = [club1.id, club2.id].sort();
      await prisma.rivalry.upsert({
        where: { club1Id_club2Id: { club1Id: sorted[0], club2Id: sorted[1] } },
        update: {},
        create: {
          club1Id: sorted[0],
          club2Id: sorted[1],
          club1Wins: Math.floor(Math.random() * 8) + 3,
          club2Wins: Math.floor(Math.random() * 6) + 2,
          draws: Math.floor(Math.random() * 3) + 1,
        },
      });
    }
  }

  console.log(`✓ rivalries created`);

  console.log("\n✓ ZIMFC Pro seeded successfully.\n");
  console.log(`Admin login → email: ${ADMIN_EMAIL}  password: ${DEFAULT_PASSWORD}`);
  console.log(`Player login → any player email: <username>@zimfc.local / ${DEFAULT_PASSWORD}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
