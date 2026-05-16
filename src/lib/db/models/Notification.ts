import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'MATCH_SCHEDULED' | 'MATCH_RESULT' | 'MATCH_CONFIRMED' | 'MATCH_DISPUTED' | 'LEAGUE_INVITE' | 'TOURNAMENT_INVITE' | 'LEAGUE_UPDATE' | 'TOURNAMENT_UPDATE' | 'STANDINGS_CHANGE' | 'FRIEND_REQUEST' | 'ACHIEVEMENT' | 'ADMIN_ANNOUNCEMENT' | 'SEASON_START' | 'SEASON_END' | 'REMINDER';
  title: string; message: string; link?: string; read: boolean;
}

const NotificationSchema = new Schema<INotification>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['MATCH_SCHEDULED', 'MATCH_RESULT', 'MATCH_CONFIRMED', 'MATCH_DISPUTED', 'LEAGUE_INVITE', 'TOURNAMENT_INVITE', 'LEAGUE_UPDATE', 'TOURNAMENT_UPDATE', 'STANDINGS_CHANGE', 'FRIEND_REQUEST', 'ACHIEVEMENT', 'ADMIN_ANNOUNCEMENT', 'SEASON_START', 'SEASON_END', 'REMINDER'], required: true },
  title: { type: String, required: true }, message: { type: String, required: true }, link: String,
  read: { type: Boolean, default: false },
}, { timestamps: true });

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
