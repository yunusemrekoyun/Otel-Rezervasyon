import argon2 from 'argon2';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { issueAuthSession, setAuthCookies } from '@/lib/auth/session';

export const runtime = 'nodejs';

const loginSchema = z.object({
  email: z.string().email().max(254).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1).max(200),
});

function invalidCredentials() {
  return NextResponse.json(
    { ok: false, message: 'Email veya şifre hatalı.' },
    { status: 401 },
  );
}

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return invalidCredentials();
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: parsed.data.email,
      },
      include: {
        role: true,
      },
    });

    if (!user || !user.isActive) {
      return invalidCredentials();
    }

    const passwordMatches = await argon2.verify(user.passwordHash, parsed.data.password).catch(() => false);

    if (!passwordMatches) {
      return invalidCredentials();
    }

    const issued = await issueAuthSession({
      user,
      request,
    });

    const response = NextResponse.json({
      ok: true,
      user: issued.user,
      redirectTo: `/${issued.user.roleSlug}`,
    });

    setAuthCookies(response, issued.accessToken, issued.refreshToken);

    return response;
  } catch (error) {
    console.error('Login failed.', error);

    return NextResponse.json(
      { ok: false, message: 'Login işlemi şu anda tamamlanamadı.' },
      { status: 503 },
    );
  }
}
