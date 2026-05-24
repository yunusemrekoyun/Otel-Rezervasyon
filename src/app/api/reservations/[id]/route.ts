import { NextRequest, NextResponse } from 'next/server';
import { getAuthContextFromRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthContextFromRequest(request).catch(() => null);
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const { action } = body ?? {};

  if (action !== 'cancel') {
    return NextResponse.json({ ok: false, message: 'Geçersiz işlem.' }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({ where: { id } }).catch(() => null);
  if (!reservation) {
    return NextResponse.json({ ok: false, message: 'Rezervasyon bulunamadı.' }, { status: 404 });
  }

  const isStaff = ['admin', 'personel'].includes(auth.user.roleSlug);
  const isOwn   = reservation.userId === auth.user.id || reservation.email === auth.user.email;
  if (!isStaff && !isOwn) {
    return NextResponse.json({ ok: false, message: 'Yetkisiz.' }, { status: 403 });
  }

  if (!['pending', 'confirmed'].includes(reservation.status)) {
    return NextResponse.json(
      { ok: false, message: 'Bu rezervasyon iptal edilemez.' },
      { status: 409 },
    );
  }

  const updated = await prisma.reservation.update({
    where: { id },
    data:  { status: 'cancelled' },
  });

  return NextResponse.json({ ok: true, reservation: updated });
}
