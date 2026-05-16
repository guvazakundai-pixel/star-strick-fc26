import mongoose, { Schema, Document } from 'mongoose';

export interface ITournament extends Document {
  name: string; logo: string; banner: string; description: string; adminId: mongoose.Types.ObjectId;
  type: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY'; format: 'KNOCKOUT' | 'GROUP_STAGE' | 'DOUBLE_ELIMINATION' | 'HYBRID';
  inviteCode: string; maxPlayers: number; currentPlayers: number; participantMode: '1V1' | '2V2' | 'TEAM';
  status: 'UPCOMING' | 'REGISTRATION' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  groups: Array<{ name: string; standings: Array<{ playerId: mongoose.Types.ObjectId; points: number; played: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; goalDifference: number; form: string[]; }>; }>;
  bracket: Array<Array<{ round: number; position: number; homePlayerId?: mongoose.Types.ObjectId; awayPlayerId?: mongoose.Types.ObjectId; homeScore?: number; awayScore?: number; winnerId?: mongoose.Types.ObjectId; nextMatchPosition?: string; status: string; matchId?: mongoose.Types.ObjectId; }>>;
  participants: mongoose.Types.ObjectId[]; matches: mongoose.Types.ObjectId[];
  winnerId?: mongoose.Types.ObjectId; runnerUpId?: mongoose.Types.ObjectId;
  rules: { groupStage: boolean; groupSize: number; qualificationPerGroup: number; homeAway: boolean; bestOf: number; matchDuration: number; };
  startDate?: Date; endDate?: Date; registrationDeadline?: Date;
}

const TournamentSchema = new Schema<ITournament>({
  name: { type: String, required: true, trim: true, minlength: 3, maxlength: 50 },
  logo: { type: String, default: '' }, banner: { type: String, default: '' }, description: { type: String, default: '', maxlength: 500 },
  adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['PUBLIC', 'PRIVATE', 'INVITE_ONLY'], default: 'PUBLIC' },
  format: { type: String, enum: ['KNOCKOUT', 'GROUP_STAGE', 'DOUBLE_ELIMINATION', 'HYBRID'], required: true },
  inviteCode: { type: String, unique: true, sparse: true },
  maxPlayers: { type: Number, required: true, min: 2, max: 128 },
  currentPlayers: { type: Number, default: 0 },
  participantMode: { type: String, enum: ['1V1', '2V2', 'TEAM'], default: '1V1' },
  status: { type: String, enum: ['UPCOMING', 'REGISTRATION', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'UPCOMING' },
  groups: [{ name: String, standings: [{ playerId: { type: Schema.Types.ObjectId, ref: 'User' }, points: { type: Number, default: 0 }, played: { type: Number, default: 0 }, wins: { type: Number, default: 0 }, draws: { type: Number, default: 0 }, losses: { type: Number, default: 0 }, goalsFor: { type: Number, default: 0 }, goalsAgainst: { type: Number, default: 0 }, goalDifference: { type: Number, default: 0 }, form: [String] }] }],
  bracket: [[{ round: Number, position: Number, homePlayerId: { type: Schema.Types.ObjectId, ref: 'User' }, awayPlayerId: { type: Schema.Types.ObjectId, ref: 'User' }, homeScore: Number, awayScore: Number, winnerId: { type: Schema.Types.ObjectId, ref: 'User' }, nextMatchPosition: String, status: { type: String, default: 'SCHEDULED' }, matchId: { type: Schema.Types.ObjectId, ref: 'Match' } }]],
  participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  matches: [{ type: Schema.Types.ObjectId, ref: 'Match' }],
  winnerId: { type: Schema.Types.ObjectId, ref: 'User' }, runnerUpId: { type: Schema.Types.ObjectId, ref: 'User' },
  rules: { groupStage: { type: Boolean, default: false }, groupSize: { type: Number, default: 4 }, qualificationPerGroup: { type: Number, default: 2 }, homeAway: { type: Boolean, default: false }, bestOf: { type: Number, default: 1 }, matchDuration: { type: Number, default: 90 } },
  startDate: Date, endDate: Date, registrationDeadline: Date,
}, { timestamps: true });

export const Tournament = mongoose.models.Tournament || mongoose.model<ITournament>('Tournament', TournamentSchema);
