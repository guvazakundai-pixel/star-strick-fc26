import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { Notification } from '@/lib/db/models/Notification';
import { getAuthUser } from '@/lib/utils/auth';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/response';

export async function GET() {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB();
    const notifications = await Notification.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ userId: user._id, read: false });
    return successResponse({ notifications, unreadCount });
  } catch (error: any) { return errorResponse(error.message, 500); }
}

export async function PATCH() {
  try {
    const user = await getAuthUser(); if (!user) return unauthorizedResponse();
    await connectDB();
    await Notification.updateMany({ userId: user._id, read: false }, { read: true });
    return successResponse({ message: 'Marked all read' });
  } catch (error: any) { return errorResponse(error.message, 500); }
}
