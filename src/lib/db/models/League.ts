import mongoose, { Schema, Document } from 'mongoose';

export interface ILeague extends Document {
  name: string; logo: string; banner: string; description: string; adminId: mongoose.Types.ObjectId;
  type: 'PUBLIC' | 'PRIVATE' | 'FRIENDS'; inviteCode: string; region: string; currentSeason: number;
  seasons: Array<{
    seasonNumber: number; status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED'; startedAt?: Date; endsAt?: Date;
    standings: Array<{ playerId: mongoose.Types.ObjectId; points: number; played: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; goalDifference: number; form: string[]; cleanSheets: number; }>;
    fixtures: mongoose.Types.ObjectId[];
  }>;
  participants: mongoose.Types.ObjectId[]; bannedPlayers: mongoose.Types.ObjectId[];
  settings: { rounds: number; homeAway: boolean; maxPlayers: number; minPlayers: number; allowDraws: boolean; autoGenerateFixtures: boolean; promotionSpots: number; relegationSpots: number; matchConfirmationType: 'BOTH' | 'ADMIN' | 'AUTO'; };
}

const LeagueSchema = new Schema<ILeague>({
  name: { type: String, required: true, trim: true, minlength: 3, maxlength: 50 },
  logo: { type: String, default: '' }, banner: { type: String, default: '' }, description: { type: String, default: '', maxlength: 500 },
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['PUBLIC', 'PRIVATE', 'FRIENDS'], default: 'PRIVATE' },
  inviteCode: { type: String, unique: true, sparse: true },
  region: { type: String, default: '' },
  currentSeason: { type: Number, default: 1 },
  seasons: [{
    seasonNumber: Number, status: { type: String, enum: ['UPCOMING', 'ACTIVE', 'COMPLETED'], default: 'UPCOMING' },
    startedAt: Date, endsAt: Date,
    standings: [{
      playerId: { type: Schema.Types.ObjectId, ref: 'User' }, points: { type: Number, default: 0 },
      played: { type: Number, default: 0 }, wins: { type: Number, default: 0 }, draws: { type: Number, default: 0 },
      losses: { type: Number, default: 0 }, goalsFor: { type: Number, default: 0 }, goalsAgainst: { type: Number, default: 0 },
      goalDifference: { type: Number, default: 0 }, form: [String], cleanSheets: { type: Number, default: 0 },
    }],
    fixtures: [{ type: Schema.Types.ObjectId, ref: 'Match' }],
  }],
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  bannedPlayers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  settings: {
    rounds: { type: Number, default: 2 }, homeAway: { type: Boolean, default: true },
    maxPlayers: { type: Number, default: 20 }, minPlayers: { type: Number, default: 2 },
    allowDraws: { type: Boolean, default: true }, autoGenerateFixtures: { type: Boolean, default: true },
    promotionSpots: { type: Number, default: 0 }, relegationSpots: { type: Number, default: 0 },
    matchConfirmationType: { type: String, enum: ['BOTH', 'ADMIN', 'AUTO'], default: 'BOTH' },
  },
}, { timestamps: true });

LeagueSchema.index({ inviteCode: 1 }, { unique: true, sparse: true });
export const League = mongoose.models.League || mongoose.model<ILeague>('League', LeagueSchema);
