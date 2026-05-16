import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string; email: string; password: string; avatar: string; rank: number; rating: number;
  stats: { totalMatches: number; wins: number; draws: number; losses: number; goalsScored: number; goalsConceded: number; winStreak: number; bestWinStreak: number; };
  friends: mongoose.Types.ObjectId[]; leagues: mongoose.Types.ObjectId[]; tournaments: mongoose.Types.ObjectId[]; achievements: string[];
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 20 },
  email: { type: String, required: true, unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
  password: { type: String, required: true, minlength: 8, select: false },
  avatar: { type: String, default: '' },
  rank: { type: Number, default: 0 },
  rating: { type: Number, default: 1000 },
  stats: {
    totalMatches: { type: Number, default: 0 }, wins: { type: Number, default: 0 }, draws: { type: Number, default: 0 },
    losses: { type: Number, default: 0 }, goalsScored: { type: Number, default: 0 }, goalsConceded: { type: Number, default: 0 },
    winStreak: { type: Number, default: 0 }, bestWinStreak: { type: Number, default: 0 },
  },
  friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  leagues: [{ type: Schema.Types.ObjectId, ref: 'League' }],
  tournaments: [{ type: Schema.Types.ObjectId, ref: 'Tournament' }],
  achievements: [String],
}, { timestamps: true });

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
