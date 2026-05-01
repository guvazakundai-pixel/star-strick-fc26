import type { City } from "./players";

export type Club = {
  id: string;
  name: string;
  shortName: string;
  city: City;
  manager: string;
  founded: number;
  rank: number;
  prev: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  playerIds: string[];
};

export const CLUBS: Club[] = [
  {
    id: "c-har",
    name: "Harare Thunder",
    shortName: "HAR",
    city: "Harare",
    manager: "Tichaona Madziva",
    founded: 2022,
    rank: 1,
    prev: 1,
    played: 38,
    wins: 26,
    draws: 5,
    losses: 7,
    goalsFor: 92,
    goalsAgainst: 38,
    points: 83,
    playerIds: ["p01", "p03", "p08", "p11", "p14", "p16"],
  },
  {
    id: "c-bul",
    name: "Bulawayo Strikers",
    shortName: "BUL",
    city: "Bulawayo",
    manager: "Mthulisi Ndlovu",
    founded: 2021,
    rank: 2,
    prev: 3,
    played: 38,
    wins: 23,
    draws: 7,
    losses: 8,
    goalsFor: 78,
    goalsAgainst: 42,
    points: 76,
    playerIds: ["p02", "p05", "p07", "p15"],
  },
  {
    id: "c-mut",
    name: "Mutare Riders",
    shortName: "MUT",
    city: "Mutare",
    manager: "Edmore Chimombe",
    founded: 2023,
    rank: 3,
    prev: 4,
    played: 38,
    wins: 21,
    draws: 7,
    losses: 10,
    goalsFor: 71,
    goalsAgainst: 48,
    points: 70,
    playerIds: ["p04", "p10", "p18"],
  },
  {
    id: "c-gwe",
    name: "Gweru Falcons",
    shortName: "GWE",
    city: "Gweru",
    manager: "Memory Maposa",
    founded: 2022,
    rank: 4,
    prev: 2,
    played: 38,
    wins: 18,
    draws: 7,
    losses: 13,
    goalsFor: 62,
    goalsAgainst: 55,
    points: 61,
    playerIds: ["p06", "p19"],
  },
  {
    id: "c-zws",
    name: "ZW Spartans",
    shortName: "SPA",
    city: "Chitungwiza",
    manager: "Dumisani Mavhunga",
    founded: 2020,
    rank: 5,
    prev: 5,
    played: 38,
    wins: 14,
    draws: 7,
    losses: 17,
    goalsFor: 55,
    goalsAgainst: 68,
    points: 49,
    playerIds: ["p09", "p12", "p13", "p20"],
  },
  {
    id: "c-vfl",
    name: "Vic Falls Lions",
    shortName: "VFL",
    city: "Victoria Falls",
    manager: "Sipho Mlilo",
    founded: 2024,
    rank: 6,
    prev: 6,
    played: 38,
    wins: 9,
    draws: 5,
    losses: 24,
    goalsFor: 42,
    goalsAgainst: 84,
    points: 32,
    playerIds: ["p17"],
  },
];

export function clubByPlayerId(playerId: string): Club | undefined {
  return CLUBS.find((c) => c.playerIds.includes(playerId));
}

export function clubById(id: string): Club | undefined {
  return CLUBS.find((c) => c.id === id);
}
