import { randomUUID } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

/**
 * Generate a CSRF token using a cryptographically secure UUID.
 */
export function generateCsrfToken(): string {
  return randomUUID();
}

/**
 * Set a CSRF token cookie on the response. The cookie is not HttpOnly so the client can read it
 * (e.g., to include it in request headers). It is marked `SameSite=Strict` to mitigate CSRF.
 */
export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set('csrf-token', token, {
    httpOnly: false,
    sameSite: 'strict',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  });
}

/**
 * Validate the CSRF token from the request.
 * Checks that the `x-csrf-token` header matches the `csrf-token` cookie value.
 * Returns `true` if valid, `false` otherwise.
 */
export function validateCsrf(request: NextRequest): boolean {
  const headerToken = request.headers.get('x-csrf-token');
  const cookieToken = request.cookies.get('csrf-token')?.value;
  return !!headerToken && !!cookieToken && headerToken === cookieToken;
}
