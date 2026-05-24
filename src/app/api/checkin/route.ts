import { NextRequest, NextResponse } from 'next/server';
import { getAuthContextFromRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const ROOM_SEL = {
  select: {
    id: true, name: true, floor: true,
    roomType: { select: { name: true } },
  },
} as const;

export async function GET(request: NextRequest) {
  const auth = await getAuthContextFromRequest(request).catch(() => null);
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const code  = searchParams.get('code')?.trim();
  const today = searchParams.get('today');

  // ── Search by confirmation code ───────────────────────────────────────────
  if (code) {
    const reservation = await prisma.reservation.findUnique({
      where:   { confirmationId: code },
      include: { room: ROOM_SEL },
    }).catch(() => null);

    if (!reservation) {
      return NextResponse.json(
        { ok: false, message: 'Rezervasyon bulunamadı.' },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, reservation });
  }

  // ── Today's arrivals and departures ───────────────────────────────────────
  if (today === 'true') {
    const todayStart = new Date(); todayStart.setHours(0,  0,  0,   0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);

    const [arrivals, departures] = await Promise.all([
      prisma.reservation.findMany({
        where: {
          checkInDate: { gte: todayStart, lte: todayEnd },
          status: { in: ['confirmed', 'pending'] },
        },
        include: { room: ROOM_SEL },
        orderBy: { room: { name: 'asc' } },
      }),
      prisma.reservation.findMany({
        where: {
          checkOutDate: { gte: todayStart, lte: todayEnd },
          status: 'checked_in',
        },
        include: { room: ROOM_SEL },
        orderBy: { room: { name: 'asc' } },
      }),
    ]);

    return NextResponse.json({ ok: true, arrivals, departures });
  }

  return NextResponse.json(
    { ok: false, message: 'code veya today parametresi gerekli.' },
    { status: 400 },
  );
}

export async function PATCH(request: NextRequest) {
  const auth = await getAuthContextFromRequest(request).catch(() => null);
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });

  if (!['admin', 'personel'].includes(auth.user.roleSlug)) {
    return NextResponse.json({ ok: false, message: 'Yetkisiz.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { confirmationId, action } = body ?? {};

  if (!confirmationId || !['checkin', 'checkout'].includes(action)) {
    return NextResponse.json({ ok: false, message: 'Geçersiz istek.' }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { confirmationId },
  });
  if (!reservation) {
    return NextResponse.json(
      { ok: false, message: 'Rezervasyon bulunamadı.' },
      { status: 404 },
    );
  }

  if (action === 'checkin' && !['pending', 'confirmed'].includes(reservation.status)) {
    return NextResponse.json(
      { ok: false, message: 'Bu rezervasyon için check-in yapılamaz.' },
      { status: 409 },
    );
  }
  if (action === 'checkout' && reservation.status !== 'checked_in') {
    return NextResponse.json(
      { ok: false, message: 'Check-out için önce check-in yapılmalı.' },
      { status: 409 },
    );
  }

  if (action === 'checkin') {
    const updated = await prisma.reservation.update({
      where: { confirmationId },
      data: { status: 'checked_in' },
      include: { room: ROOM_SEL },
    });
    return NextResponse.json({ ok: true, reservation: updated });
  }

  // checkout — atomically mark room as cleaning and create a task
  const [updated] = await prisma.$transaction([
    prisma.reservation.update({
      where: { confirmationId },
      data: { status: 'checked_out' },
      include: { room: ROOM_SEL },
    }),
    prisma.room.update({
      where: { id: reservation.roomId },
      data: { status: 'cleaning' },
    }),
    prisma.cleaningTask.create({
      data: {
        roomId: reservation.roomId,
        reportedById: auth.user.id,
        status: 'pending',
        priority: 'normal',
        notes: 'Check-out sonrası otomatik temizlik görevi',
      },
    }),
  ]);

  return NextResponse.json({ ok: true, reservation: updated });
}
