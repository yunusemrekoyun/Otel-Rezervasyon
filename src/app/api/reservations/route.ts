import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cabins } from '@/data';
import { getAuthContextFromRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const cleaningFee = 85;
const serviceFee = 45;

const reservationSchema = z.object({
  cabinId: z.string().min(1),
  checkInDay: z.coerce.number().int(),
  checkOutDay: z.coerce.number().int(),
  guestsCount: z.coerce.number().int(),
});

export async function POST(request: NextRequest) {
  const parsed = reservationSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Reservation data is invalid.' },
      { status: 400 },
    );
  }

  const cabin = cabins.find((item) => item.id === parsed.data.cabinId);
  const checkInDay = parsed.data.checkInDay;
  const checkOutDay = parsed.data.checkOutDay;
  const guestsCount = parsed.data.guestsCount;

  if (!cabin) {
    return NextResponse.json(
      { ok: false, message: 'Selected cabin was not found.' },
      { status: 404 },
    );
  }

  if (checkInDay < 1 || checkOutDay > 31 || checkOutDay <= checkInDay) {
    return NextResponse.json(
      { ok: false, message: 'Check-in and check-out days are invalid.' },
      { status: 400 },
    );
  }

  if (guestsCount < 1 || guestsCount > 6) {
    return NextResponse.json(
      { ok: false, message: 'Guest count must be between 1 and 6.' },
      { status: 400 },
    );
  }

  const nights = checkOutDay - checkInDay;
  const subtotal = cabin.price * nights;
  const totalPrice = subtotal + cleaningFee + serviceFee;
  const confirmationId = `WN-RES-${Date.now().toString(36).toUpperCase()}`;
  const auth = await getAuthContextFromRequest(request).catch(() => null);
  const checkInDate = new Date(Date.UTC(2026, 4, checkInDay));
  const checkOutDate = new Date(Date.UTC(2026, 4, checkOutDay));

  try {
    await prisma.reservation.create({
      data: {
        userId: auth?.user.id,
        cabinId: cabin.id,
        cabinName: cabin.name,
        checkInDate,
        checkOutDate,
        guestsCount,
        nights,
        subtotal,
        cleaningFee,
        serviceFee,
        totalPrice,
        confirmationId,
      },
    });
  } catch (error) {
    console.error('Reservation persistence failed.', error);

    return NextResponse.json(
      { ok: false, message: 'Reservation could not be stored.' },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    confirmationId,
    reservation: {
      cabinId: cabin.id,
      cabinName: cabin.name,
      checkInDate: `2026-05-${String(checkInDay).padStart(2, '0')}`,
      checkOutDate: `2026-05-${String(checkOutDay).padStart(2, '0')}`,
      guestsCount,
      nights,
      subtotal,
      cleaningFee,
      serviceFee,
      totalPrice,
    },
  });
}
