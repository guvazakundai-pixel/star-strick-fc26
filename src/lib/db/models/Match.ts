import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
  leagueId?: mongoose.Types.ObjectId; tournamentId?: mongoose.Types.ObjectId;
  bracketRound?: number; bracketPosition?: number; groupName?: string;
  homePlayerId: mongoose.Types.ObjectId; awayPlayerId: mongoose.Types.ObjectId;
  homeScore?: number; awayScore?: number; winnerId?: mongoose.Types.ObjectId;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED' | 'FORFEIT' | 'CANCELLED';
  matchday?: number; scheduledDate?: Date; playedDate?: Date;
  confirmation: { home: 'PENDING' | 'CONFIRMED' | 'DISPUTED'; away: 'PENDING' | 'CONFIRMED' | 'DISPUTED'; };
  screenshotUrl?: string; disputeReason?: string; disputeResolved: boolean;
  forfeitedBy?: mongoose.Types.ObjectId; notes: string;
}

const MatchSchema = new Schema<IMatch>({
  leagueId: { type: Schema.Types.ObjectId, ref: 'League' }, tournamentId: { type: Schema.Types.ObjectId, ref: 'Tournament' },
  bracketRound: Number, bracketPosition: Number, groupName: String,
  homePlayerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  awayPlayerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  homeScore: Number, awayScore: Number, winnerId: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED', 'FORFEIT', 'CANCELLED'], default: 'SCHEDULED' },
  matchday: Number, scheduledDate: Date, playedDate: Date,
  confirmation: { home: { type: String, enum: ['PENDING', 'CONFIRMED', 'DISPUTED'], default: 'PENDING' }, away: { type: String, enum: ['PENDING', 'CONFIRMED', 'DISPUTED'], default: 'PENDING' } },
  screenshotUrl: String, disputeReason: String, disputeResolved: { type: Boolean, default: false },
  forfeitedBy: { type: Schema.Types.ObjectId, ref: 'User' }, notes: { type: String, default: '' },
}, { timestamps: true });

MatchSchema.index({ leagueId: 1, status: 1 }); MatchSchema.index({ tournamentId: 1, status: 1 });
MatchSchema.index({ homePlayerId: 1 }); MatchSchema.index({ awayPlayerId: 1 });

export const Match = mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);
