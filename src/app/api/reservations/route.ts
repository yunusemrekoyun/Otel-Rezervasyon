import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContextFromRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const reservationSchema = z.object({
  roomId: z.string().min(1),
  checkInDate: z.string().min(1),
  checkOutDate: z.string().min(1),
  adultsCount: z.coerce.number().int().min(1).max(10),
  childrenCount: z.coerce.number().int().min(0).max(10),
  firstName: z.string().min(1).max(100).transform(v => v.trim()),
  lastName: z.string().min(1).max(100).transform(v => v.trim()),
  email: z.string().email().max(254).transform(v => v.trim().toLowerCase()),
  phone: z.string().min(1).max(30).transform(v => v.trim()),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional().default('TR'),
  tcKimlikNo: z.string().optional(),
  passportNo: z.string().optional(),
  passportExpiry: z.string().optional(),
  companyName: z.string().optional(),
  taxNumber: z.string().optional(),
  taxOffice: z.string().optional(),
  specialRequests: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest) {
  const parsed = reservationSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Rezervasyon bilgileri geçersiz.', errors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const checkIn = new Date(data.checkInDate);
  const checkOut = new Date(data.checkOutDate);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkOut <= checkIn) {
    return NextResponse.json(
      { ok: false, message: 'Geçersiz tarih aralığı.' },
      { status: 400 },
    );
  }

  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  const room = await prisma.room.findUnique({
    where: { id: data.roomId },
  });

  if (!room || !room.isActive) {
    return NextResponse.json(
      { ok: false, message: 'Seçilen oda bulunamadı.' },
      { status: 404 },
    );
  }

  // Çakışan rezervasyon kontrolü
  const conflicting = await prisma.reservation.findFirst({
    where: {
      roomId: data.roomId,
      status: { notIn: ['cancelled'] },
      AND: [
        { checkInDate: { lt: checkOut } },
        { checkOutDate: { gt: checkIn } },
      ],
    },
  });

  if (conflicting) {
    return NextResponse.json(
      { ok: false, message: 'Seçilen tarihler için bu oda müsait değil.' },
      { status: 409 },
    );
  }

  const subtotal = room.basePrice * nights;
  const totalPrice = subtotal;
  const confirmationId = Math.floor(10000000 + Math.random() * 90000000).toString();

  const auth = await getAuthContextFromRequest(request).catch(() => null);

  try {
    const reservation = await prisma.reservation.create({
      data: {
        confirmationId,
        roomId: data.roomId,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        nights,
        adultsCount: data.adultsCount,
        childrenCount: data.childrenCount,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        gender: data.gender || undefined,
        nationality: data.nationality,
        tcKimlikNo: data.tcKimlikNo || undefined,
        passportNo: data.passportNo || undefined,
        passportExpiry: data.passportExpiry ? new Date(data.passportExpiry) : undefined,
        companyName: data.companyName || undefined,
        taxNumber: data.taxNumber || undefined,
        taxOffice: data.taxOffice || undefined,
        specialRequests: data.specialRequests || undefined,
        subtotal,
        totalPrice,
        userId: auth?.user.id ?? undefined,
      },
      include: {
        room: { select: { id: true, name: true, basePrice: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      confirmationId,
      reservation: {
        id: reservation.id,
        confirmationId: reservation.confirmationId,
        roomName: reservation.room.name,
        checkInDate: reservation.checkInDate.toISOString().split('T')[0],
        checkOutDate: reservation.checkOutDate.toISOString().split('T')[0],
        nights: reservation.nights,
        adultsCount: reservation.adultsCount,
        childrenCount: reservation.childrenCount,
        subtotal: reservation.subtotal,
        totalPrice: reservation.totalPrice,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Reservation creation failed.', error);
    return NextResponse.json(
      { ok: false, message: 'Rezervasyon kaydedilemedi.' },
      { status: 503 },
    );
  }
}

export async function GET(request: NextRequest) {
  const auth = await getAuthContextFromRequest(request).catch(() => null);
  if (!auth) {
    return NextResponse.json({ ok: false, message: 'Yetkisiz.' }, { status: 401 });
  }

  try {
    const where = auth.user.roleSlug === 'admin' || auth.user.roleSlug === 'personel'
      ? {}
      : { OR: [{ userId: auth.user.id }, { email: auth.user.email }] };

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        room: { select: { id: true, name: true, roomType: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ ok: true, reservations });
  } catch (error) {
    console.error('Reservations fetch failed.', error);
    return NextResponse.json({ ok: false, message: 'Rezervasyonlar alınamadı.' }, { status: 503 });
  }
}
