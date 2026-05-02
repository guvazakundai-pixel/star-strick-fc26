import { PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  await prisma.clubMember.deleteMany()
  await prisma.clubRanking.deleteMany()
  await prisma.globalClubRanking.deleteMany()
  await prisma.playerStats.deleteMany()
  await prisma.media.deleteMany()
  await prisma.managerApplication.deleteMany()
  await prisma.club.deleteMany()
  await prisma.user.deleteMany()

  const adminPassword = await bcrypt.hash("admin123", 12)
  await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@starstrick.com",
      passwordHash: adminPassword,
      role: "ADMIN",
      playerStats: { create: {} },
    },
  })

  const INITIAL_CLUBS = [
    { name: "Game Nation", city: "Harare", rank: 1 },
    { name: "GameStop", city: "Bulawayo", rank: 2 },
    { name: "Keep4Gaming", city: "Harare", rank: 3 },
    { name: "Elite Strikers", city: "Mutare", rank: 4 },
    { name: "Digital Warriors", city: "Gweru", rank: 5 },
  ]

  const playerNames = [
    ["Tendai", "Rudo", "Simba"],
    ["Nyasha", "Kuda", "Tatenda"],
    ["Farai", "Tariro", "Blessing"],
    ["Tinashe", "Tafadzwa", "Rumbidzai"],
    ["Takudzwa", "Shepherd", "Munashe"],
  ]

  for (let i = 0; i < INITIAL_CLUBS.length; i++) {
    const clubData = INITIAL_CLUBS[i]
    const slug = clubData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")
    const managerPassword = await bcrypt.hash("password123", 12)

    const manager = await prisma.user.create({
      data: {
        username: `${clubData.name.toLowerCase().replace(/\s+/g, "_")}_manager`,
        email: `manager.${clubData.name.toLowerCase().replace(/\s+/g, ".")}@starstrick.com`,
        passwordHash: managerPassword,
        role: "MANAGER",
        playerStats: {
          create: {
            matchesPlayed: Math.floor(Math.random() * 50) + 20,
            wins: Math.floor(Math.random() * 30) + 10,
            losses: Math.floor(Math.random() * 15),
            draws: Math.floor(Math.random() * 10),
            goalsScored: Math.floor(Math.random() * 80) + 20,
          },
        },
      },
    })

    const club = await prisma.club.create({
      data: {
        name: clubData.name,
        slug,
        city: clubData.city,
        country: "Zimbabwe",
        description: `Professional esports club based in ${clubData.city}.`,
        managerId: manager.id,
        members: {
          create: {
            userId: manager.id,
            role: "CO_MANAGER",
            status: "APPROVED",
          },
        },
      },
    })

    await prisma.globalClubRanking.create({
      data: {
        clubId: club.id,
        rankPosition: clubData.rank,
        totalPoints: 100 - i * 15,
        wins: Math.floor(Math.random() * 30) + 15,
        losses: Math.floor(Math.random() * 10),
      },
    })

    for (let j = 0; j < 3; j++) {
      const name = playerNames[i][j]
      const pw = await bcrypt.hash("password123", 12)

      const player = await prisma.user.create({
        data: {
          username: `${name.toLowerCase()}_${slug}`,
          email: `${name.toLowerCase()}.${slug}@starstrick.com`,
          passwordHash: pw,
          role: "PLAYER",
          playerStats: {
            create: {
              matchesPlayed: Math.floor(Math.random() * 40) + 10,
              wins: Math.floor(Math.random() * 20) + 5,
              losses: Math.floor(Math.random() * 15),
              draws: Math.floor(Math.random() * 10),
              goalsScored: Math.floor(Math.random() * 50) + 10,
            },
          },
        },
      })

      await prisma.clubMember.create({
        data: {
          userId: player.id,
          clubId: club.id,
          role: "PLAYER",
          status: "APPROVED",
        },
      })

      await prisma.clubRanking.create({
        data: {
          clubId: club.id,
          userId: player.id,
          rankPosition: j + 2,
          points: 100 - j * 20 - i * 5,
        },
      })
    }
  }

  console.log("Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
