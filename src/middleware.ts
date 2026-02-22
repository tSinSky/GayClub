import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'fallback-secret-change-me-please-32ch'
);

export async function middleware(request: NextRequest) {
  // Only protect /admin routes (except the login page itself, which is /admin)
  const path = request.nextUrl.pathname;

  // /admin is the login page — always accessible
  if (path === '/admin') {
    return NextResponse.next();
  }

  // All other /admin/* routes require auth
  if (path.startsWith('/admin/')) {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
