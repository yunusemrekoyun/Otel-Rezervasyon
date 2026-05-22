import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME, ROLE_SLUGS, isRoleSlug } from '@/lib/auth/constants';

function getProtectedRole(pathname: string) {
  const segment = pathname.split('/').filter(Boolean)[0];
  return segment && isRoleSlug(segment) ? segment : null;
}

async function verifyRoleFromAccessToken(token?: string) {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!token || !secret || secret.length < 32) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ['HS256'],
    });

    return typeof payload.roleSlug === 'string' && isRoleSlug(payload.roleSlug)
      ? payload.roleSlug
      : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const requestedRole = getProtectedRole(request.nextUrl.pathname);

  if (!requestedRole) {
    return NextResponse.next();
  }

  const accessRole = await verifyRoleFromAccessToken(request.cookies.get(ACCESS_COOKIE_NAME)?.value);

  if (accessRole) {
    if (accessRole !== requestedRole) {
      return NextResponse.redirect(new URL(`/${accessRole}`, request.url));
    }

    return NextResponse.next();
  }

  if (request.cookies.get(REFRESH_COOKIE_NAME)?.value) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/personel/:path*',
    '/muhasebe/:path*',
    '/musteri/:path*',
    '/temizlikci/:path*',
  ],
};
