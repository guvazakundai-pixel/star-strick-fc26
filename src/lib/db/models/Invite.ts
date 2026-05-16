import mongoose, { Schema, Document } from 'mongoose';

export interface IInvite extends Document {
  code: string; type: 'LEAGUE' | 'TOURNAMENT'; targetId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId; maxUses: number; currentUses: number;
  expiresAt?: Date; isActive: boolean;
}

const InviteSchema = new Schema<IInvite>({
  code: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ['LEAGUE', 'TOURNAMENT'], required: true },
  targetId: { type: Schema.Types.ObjectId, required: true, refPath: 'type' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  maxUses: { type: Number, default: 0 }, currentUses: { type: Number, default: 0 },
  expiresAt: Date, isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Invite = mongoose.models.Invite || mongoose.model<IInvite>('Invite', InviteSchema);
