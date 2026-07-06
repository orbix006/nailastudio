import { NextRequest, NextResponse } from 'next/server';
import { verifySubscriberTokenAction } from '@/lib/newsletter-actions';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token parameter is missing.' }, { status: 400 });
    }

    const res = await verifySubscriberTokenAction(token);

    if (!res.success) {
      return NextResponse.json({ error: 'Invalid or expired activation token.' }, { status: 400 });
    }

    // Redirect to subscription success landing page
    return NextResponse.redirect(new URL('/newsletter-success', request.url));
  } catch (err) {
    console.error('Newsletter verification route error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
