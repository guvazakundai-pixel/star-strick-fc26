# Star Strick FC26 — Product Roadmap

## Overview
Zimbabwe's competitive EA FC ladder. Features ordered by impact vs. effort.

---

## Phase 0: Quick Wins (1–3 days each)

### 0.1 City-Based Leaderboard Tabs
**Files:** `src/components/RankingsNew.tsx`, `src/lib/players.ts`

Add filter tabs for each city (Harare, Bulawayo, Mutare, Gweru, Kwekwe, Masvingo, Chitungwiza, Victoria Falls). Show a "ZW National" tab as default plus individual city tabs. Each tab filters `PLAYERS` by `p.city`.

- Already have `CITY` type and `FilterChip` component — just need a horizontal tab bar above the rankings
- Each tab shows city rank # (re-indexed per city) + ZW national rank
- Low effort, high engagement — players want to see where they stand locally

### 0.2 Social Links on Player Profile
**Files:** `src/components/PlayerDetailModal.tsx`, `src/lib/players.ts`

Add optional fields to `Player` type:
```ts
discord?: string
twitter?: string
twitch?: string
instagram?: string
```

Display as icon links in `DetailView`. Standard for competitive FC players (see EA FC Pro registration requirements).

### 0.3 Shona / Ndebele Toggle
**Files:** `src/lib/i18n.ts` (new), layout, key components

Simple JSON translation keys for common UI strings:
```ts
const SHONA = { rankings: "Zvibodzwa", challenges: "Makwikwi", /* ... */ }
const NDEBELE = { rankings: "Izibopho", challenges: "Imincintiswano", /* ... */ }
const ENGLISH = { rankings: "Rankings", challenges: "Challenges", /* ... */ }
```

Add a language switcher in the header. Store preference in `localStorage`.

### 0.4 ZW Flag Badges & City Titles
**Files:** `src/components/RankingsNew.tsx`, globals.css

Add cosmetic badges:
- "🇿🇼 ZW" flag badge on all player cards
- City-specific titles: "Harare King", "Bulawayo Legend", "Mutare Warrior"
- Rank-specific titles: "Elite Gladiator", "Pro Contender", "Challenger Rising", "Rookie Prospect"

---

## Phase 1: Engagement (1–2 weeks each)

### 1.1 Full Tournament System

**New files:**
```
src/components/tournaments/
├── TournamentBracket.tsx     # Visual bracket (knockout)
├── TournamentList.tsx        # List of active/upcoming/completed
├── TournamentDetail.tsx      # Single tournament view
├── TournamentForm.tsx        # Create tournament form
src/app/tournaments/
├── page.tsx                  # Tournaments list page
├── [id]/page.tsx             # Single tournament page
src/app/api/tournaments/
├── route.ts                  # CRUD + bracket generation
├── [id]/register/route.ts    # Player registration
├── [id]/report/route.ts      # Match result reporting
```

**Schema additions** (`prisma/schema.prisma`):
```prisma
model Tournament {
  id           String   @id @default(uuid())
  name         String
  type         String   // KNOCKOUT | ROUND_ROBIN | SWISS
  division     String?  // Elite | Pro | Challenger | Rookie | null (open)
  city         String?  // null = national
  maxPlayers   Int      @default(16)
  entryFee     Int      @default(0)  // in USD cents, 0 = free
  prizePool    Int      @default(0)
  status       String   // REGISTRATION | LIVE | COMPLETED | CANCELLED
  bracket      Json?    // Serialized bracket data
  startAt      DateTime?
  endAt        DateTime?
  createdAt    DateTime @default(now())
  organizerId  String
  organizer    User     @relation(...)
  participants TournamentParticipant[]
  matches      TournamentMatch[]
}
```

**Game modes supported:**
- Division-locked (only Elite can enter Elite tourney)
- City-specific (Harare-only tournaments)
- Open (anyone)
- Knockout (single elimination, standard)
- Round-robin groups → knockout (for bigger player pools)

**Match flow:**
1. System assigns opponent
2. Both players get WhatsApp notification + in-app alert
3. Players play match, report score
4. Opponent confirms or disputes
5. Admin auto-resolves disputes after 48h
6. Bracket advances automatically

### 1.2 WhatsApp Notification Integration

**New files:**
```
src/lib/whatsapp.ts           # WhatsApp Business API client
src/app/api/webhooks/whatsapp/route.ts  # Incoming webhook handler
```

**Architecture:**
```
Server Action → WhatsApp API → User receives message → User replies → Webhook → Update record
```

**Trigger events:**
- Challenge received → "Farai Chikomo (FARABALL) has challenged you! Reply 'ACCEPT' to confirm"
- Match reminder → "Your Round 2 match vs Tapiwa Gono starts in 1 hour"
- Tournament bracket advance → "You advanced to the semi-finals!"
- EcoCash payment received → "Entry fee confirmed, you're registered for Harare Cup"
- New ranking position → "You moved up to #4 in Harare! 🔥"

**Implementation:** Use WhatsApp Business API (free tier available) or WhatsApp Cloud API (Meta). Store phone numbers in User model (already have `phone` field).

### 1.3 Clubs / Squads System

**New files:**
```
src/components/clubs/
├── ClubCreateForm.tsx
├── ClubDetail.tsx
├── ClubList.tsx
├── ClubMemberList.tsx
├── ClubRankings.tsx
src/app/clubs/
├── page.tsx
├── [id]/page.tsx
src/app/api/clubs/
├── route.ts
├── [id]/route.ts
├── [id]/members/route.ts
```

**Already exists in schema:** `Club`, `ClubMember`, `ClubRanking`, `GlobalClubRanking` models are already defined in Prisma! Only need frontend + API routes.

**Features:**
- Create/join/leave clubs (max 10 members)
- Club vs club challenges
- Club leaderboard (already `GlobalClubRanking` model exists)
- Club chat (in-app + WhatsApp group link)

---

## Phase 2: Monetization (2–3 weeks each)

### 2.1 EcoCash Payment Integration

**New files:**
```
src/lib/ecocash.ts            # EcoCash Open API client
src/app/api/payments/
├── route.ts                  # Initiate payment
├── webhook/route.ts          # Payment confirmation webhook
src/app/api/payouts/
├── route.ts                  # Initiate payout
src/components/PaymentModal.tsx  # Payment UI
```

**Flow:**
```
User clicks "Pay Entry Fee"
  → Enter EcoCash phone number
  → API initiates payment request (EcoCash Open API)
  → User receives EcoCash prompt on phone
  → User enters PIN
  → Webhook confirms payment
  → User registered for tournament
```

**Payout flow:**
```
Tournament ends
  → Admin triggers payout
  → API sends EcoCash to winner's phone
  → Winner receives notification
```

**EcoCash Open API endpoints needed:**
- `POST /api/payments` — Request payment from user
- `POST /api/payouts` — Send payout to user
- Webhook callback for payment confirmation

**Registration:** Requires EcoCash developer account at `developers.ecocash.co.zw`. Get API key, set up callback URL.

### 2.2 Challenge Wager System

**New files:**
```
src/app/api/wagers/
├── route.ts                  # Create wager
├── [id]/accept/route.ts      # Accept wager
├── [id]/resolve/route.ts     # Resolve (report result)
├── [id]/dispute/route.ts     # Dispute resolution
src/components/WagerModal.tsx  # Wager UI
```

**Flow:**
```
Player A challenges Player B with $5 wager
  → Both players' EcoCash held in escrow (total $10)
  → Players play match
  → Both report score (or upload screenshot)
  → If match, winner gets $10 - 5% fee = $9.50
  → Platform keeps $0.50 (micro-commission)
```

**Dispute resolution:**
- Both players upload match screenshots
- Admin panel for dispute review
- If one player doesn't respond in 48h, default to other player

### 2.3 Prize Pool & Season Pass

**New files:**
```
src/lib/prizes.ts             # Prize pool calculation
src/app/api/seasons/
├── route.ts                  # Season CRUD
├── current/route.ts          # Current season info
src/components/SeasonPass.tsx  # Season pass UI
```

**Season pass model:**
- Monthly/bi-monthly seasons
- Free tier: basic rewards (badges, titles)
- Premium tier ($5-$10 via EcoCash): exclusive cosmetics, double XP, priority support
- Prize pool: 50% of premium passes goes to top 10 leaderboard at season end

**Revenue split (per season):**
| Item | % |
|---|---|
| Tournament prize pools | 50% |
| Platform operations | 25% |
| Community giveaways | 15% |
| Development fund | 10% |

---

## Phase 3: Scale (3–4 weeks each)

### 3.1 Data-Saver / Lite Mode

**Files:** `src/lib/data-saver.ts` (new), `src/components/DataSaverToggle.tsx` (new)

**What it does:**
- Disables all animations (Framer Motion)
- Removes background gradients and grain textures
- Strips avatars to initials only
- Reduces image quality
- Compresses API responses
- Goal: < 50KB per page load instead of ~500KB+

**Implementation:**
```ts
// src/lib/data-saver.ts
export const useDataSaver = () => {
  const [enabled, setEnabled] = useState(
    typeof navigator !== "undefined" && 
    (navigator as any).connection?.saveData === true
  )
  // Also check localStorage preference
  return enabled
}
```

Wrap animations in DataSaver context:
```tsx
{!dataSaver && <motion.div animate={...}>...</motion.div>}
```

Also negotiate with Econet/NetOne/Telecel for **zero-rated data** for the platform (like how WhatsApp is free on Econet).

### 3.2 Player Statistics & Analytics

**New files:**
```
src/components/stats/
├── PlayerRadar.tsx           # Radar chart (offense, defense, control)
├── PerformanceGraph.tsx      # Points/rank over time
├── HeadToHead.tsx            # H2H record between two players
├── SeasonStats.tsx           # Per-season breakdown
src/app/api/stats/
├── route.ts                  # Aggregate stats
├── [id]/route.ts             # Per-player stats
├── [id]/h2h/[otherId]/route.ts  # H2H between two
```

Already have `PlayerStats`, `PlayerRanking`, `RankingHistory` models in Prisma.

### 3.3 Mobile Companion (PWA)

**Files:** `src/app/manifest.ts` (new), service worker

Convert to Progressive Web App:
- `manifest.json` with ZW-themed icons
- Service worker for offline rankings cache
- "Add to Home Screen" prompt
- Push notifications (for challenges, tournaments)

ZW-specific PWA considerations:
- No app store required — share link on WhatsApp
- Works on any Android phone (99% of ZW market)
- Offline-first: cached rankings still viewable without data

---

## Architecture Decisions

### Payment Flow (EcoCash)
```
User Action → Backend → EcoCash API → User Phone → PIN → EcoCash → Webhook → Backend → UI Update
```

### Database (already using Turso/libsql + Prisma)
All new models in `prisma/schema.prisma`. Run `npx prisma db push` after schema changes.

### State Management
Keep using React state + `useMemo`/`useCallback` — no Redux needed at this scale.

### API Pattern
```
app/api/[resource]/route.ts     → CRUD
app/api/[resource]/[id]/route.ts → Single resource
```

### Notifications
- **In-app:** Toast/banner via context
- **WhatsApp:** WhatsApp Business Cloud API
- **Push:** PWA Service Worker registration (Phase 3)

---

## Implementation Priority Matrix

| Feature | Effort | Impact | Phase |
|---|---|---|---|
| City leaderboard tabs | 1 day | High | 0 |
| Social links on profile | 0.5 day | Medium | 0 |
| ZW badges & city titles | 0.5 day | Medium | 0 |
| Shona/Ndebele toggle | 1 day | Medium | 0 |
| Tournament system | 2 weeks | Very High | 1 |
| WhatsApp notifications | 1 week | Very High | 1 |
| Clubs (already in schema) | 1 week | High | 1 |
| EcoCash payments | 2 weeks | Very High | 2 |
| Challenge wagers | 1.5 weeks | High | 2 |
| Season pass | 1 week | Medium | 2 |
| Data-saver mode | 3 days | High | 3 |
| PWA companion | 1 week | Medium | 3 |
| Player analytics | 1 week | Medium | 3 |

---

## Revenue Model (for sustainability)

| Source | Est. Monthly |
|---|---|
| Tournament entry fees (5% rake) | $50-200 |
| Premium season passes | $100-500 |
| Challenge wager micro-fee (5%) | $20-100 |
| Featured player slots | $50-100 |
| **Total** | **$220-900/mo** |

Costs are negligible (Turso free tier, Vercel hobby, WhatsApp API free tier). Surplus goes to:
- Tournament prize pool top-ups
- Data bundle giveaways for top players
- Community events
