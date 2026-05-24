import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContextFromRequest } from '@/lib/auth/session';

export const runtime = 'nodejs';

const STAFF_ROLES = ['admin', 'personel', 'temizlikci'];

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContextFromRequest(request);
    if (!auth || !STAFF_ROLES.includes(auth.user.roleSlug)) {
      return NextResponse.json({ ok: false, message: 'Yetkisiz erişim.' }, { status: 403 });
    }

    const where = auth.user.roleSlug === 'temizlikci'
      ? { assignedToId: auth.user.id, status: { not: 'done' } }
      : {};

    const tasks = await prisma.cleaningTask.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      include: {
        room: { select: { id: true, name: true, floor: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return NextResponse.json({ ok: true, tasks });
  } catch {
    return NextResponse.json({ ok: false, message: 'Görevler alınamadı.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContextFromRequest(request);
    if (!auth || !['admin', 'personel'].includes(auth.user.roleSlug)) {
      return NextResponse.json({ ok: false, message: 'Yetkisiz erişim.' }, { status: 403 });
    }

    const body = await request.json();
    const { roomId, assignedToId, priority = 'normal', notes } = body;

    if (!roomId) {
      return NextResponse.json({ ok: false, message: 'Oda seçilmedi.' }, { status: 400 });
    }

    const task = await prisma.$transaction(async tx => {
      const t = await tx.cleaningTask.create({
        data: {
          roomId,
          reportedById: auth.user.id,
          assignedToId: assignedToId || null,
          priority,
          notes: notes || null,
          status: 'pending',
        },
        include: {
          room: { select: { id: true, name: true, floor: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });
      // Mark room as cleaning
      await tx.room.update({ where: { id: roomId }, data: { status: 'cleaning' } });
      return t;
    });

    return NextResponse.json({ ok: true, task }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Görev oluşturulamadı.';
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
