import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export function generateInviteCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}
export function generateId(): string { return uuidv4(); }
export function generateBracketId(round: number, position: number): string {
  return `R${round}-P${position}`;
}
