import { connectDB } from '@/lib/db/connection';
import { getAuthUser } from '@/lib/utils/auth';
import { successResponse, unauthorizedResponse, errorResponse } from '@/lib/utils/response';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorizedResponse();
    return successResponse({ user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar, rating: user.rating, rank: user.rank, stats: user.stats, friends: user.friends, leagues: user.leagues, tournaments: user.tournaments, achievements: user.achievements } });
  } catch (error: any) { return errorResponse(error.message, 500); }
}
