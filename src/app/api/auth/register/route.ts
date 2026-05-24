import argon2 from 'argon2';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { issueAuthSession, setAuthCookies } from '@/lib/auth/session';

export const runtime = 'nodejs';

const registerSchema = z.object({
  email: z.string().email().max(254).transform(v => v.trim().toLowerCase()),
  password: z.string().min(8).max(200),
  profileOwner: z.enum(['self', 'guest']).default('self'),
  firstName: z.string().min(1).max(100).transform(v => v.trim()),
  lastName: z.string().min(1).max(100).transform(v => v.trim()),
  phone: z.string().min(1).max(30).transform(v => v.trim()),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  tcKimlikNo: z.string().optional(),
  passportNo: z.string().optional(),
  passportExpiry: z.string().optional(),
  companyName: z.string().optional(),
  taxNumber: z.string().optional(),
  taxOffice: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = registerSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Geçersiz kayıt bilgileri.' },
      { status: 400 },
    );
  }

  const {
    email, password, profileOwner, firstName, lastName, phone,
    birthDate, gender, nationality,
    tcKimlikNo, passportNo, passportExpiry,
    companyName, taxNumber, taxOffice,
  } = parsed.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { ok: false, message: 'Bu e-posta adresi zaten kayıtlı.' },
        { status: 409 },
      );
    }

    const musteriRole = await prisma.role.findUnique({ where: { slug: 'musteri' } });
    if (!musteriRole) {
      return NextResponse.json(
        { ok: false, message: 'Müşteri rolü bulunamadı.' },
        { status: 500 },
      );
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          roleId: musteriRole.id,
          ...(profileOwner === 'self' && {
            firstName,
            lastName,
            phone,
            birthDate: birthDate ? new Date(birthDate) : undefined,
            gender: gender || undefined,
            nationality: nationality || 'TR',
            tcKimlikNo: tcKimlikNo || undefined,
            passportNo: passportNo || undefined,
            passportExpiry: passportExpiry ? new Date(passportExpiry) : undefined,
            companyName: companyName || undefined,
            taxNumber: taxNumber || undefined,
            taxOffice: taxOffice || undefined,
          }),
        },
        include: { role: true },
      });

      await tx.accountPerson.create({
        data: {
          userId: createdUser.id,
          label: `${firstName} ${lastName}`.trim(),
          relation: profileOwner === 'self' ? 'self' : 'guest',
          isDefault: profileOwner === 'self',
          firstName,
          lastName,
          email,
          phone,
          birthDate: birthDate ? new Date(birthDate) : undefined,
          gender: gender || undefined,
          nationality: nationality || 'TR',
          tcKimlikNo: tcKimlikNo || undefined,
          passportNo: passportNo || undefined,
          passportExpiry: passportExpiry ? new Date(passportExpiry) : undefined,
          companyName: companyName || undefined,
          taxNumber: taxNumber || undefined,
          taxOffice: taxOffice || undefined,
        },
      });

      return createdUser;
    });

    const issued = await issueAuthSession({ user, request });
    const response = NextResponse.json({
      ok: true,
      user: issued.user,
      redirectTo: '/musteri',
      needsProfileSetup: profileOwner === 'guest',
    }, { status: 201 });

    setAuthCookies(response, issued.accessToken, issued.refreshToken);
    return response;
  } catch (error) {
    console.error('Register failed.', error);
    return NextResponse.json(
      { ok: false, message: 'Kayıt işlemi şu anda tamamlanamadı.' },
      { status: 503 },
    );
  }
}
