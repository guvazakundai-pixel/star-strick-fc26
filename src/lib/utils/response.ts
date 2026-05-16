import { NextResponse } from 'next/server';

export function successResponse(data: any, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}
export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}
export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}
export function notFoundResponse(message = 'Not found') {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}
