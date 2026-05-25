import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthContextFromRequest } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/audit';

export const runtime = 'nodejs';

const STAFF_ROLES = ['admin', 'personel', 'temizlikci'];
const cleaningCreateSchema = z.object({
  roomId: z.string().min(1),
  assignedToId: z.string().nullable().optional(),
  priority: z.enum(['normal', 'urgent']).default('normal'),
  notes: z.string().max(1000).nullable().optional(),
});

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

    const parsed = cleaningCreateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: 'Temizlik görevi bilgileri geçersiz.' }, { status: 400 });
    }
    const { roomId, assignedToId, priority, notes } = parsed.data;

    const task = await prisma.$transaction(async tx => {
      const roomUpdate = await tx.room.updateMany({
        where: { id: roomId, status: 'available' },
        data: { status: 'cleaning' },
      });

      if (roomUpdate.count !== 1) {
        throw new Error('ROOM_NOT_AVAILABLE');
      }

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
      return t;
    });

    await writeAuditLog({
      request,
      auth,
      action: 'cleaning.create',
      entityType: 'cleaning_task',
      entityId: task.id,
      summary: `Temizlik görevi oluşturuldu: oda ${task.room.name}`,
      after: {
        roomId,
        assignedToId: assignedToId ?? null,
        priority,
        status: task.status,
      },
    });

    return NextResponse.json({ ok: true, task }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === 'ROOM_NOT_AVAILABLE') {
      return NextResponse.json(
        { ok: false, message: 'Oda şu anda manuel temizlik atamasına uygun değil.' },
        { status: 409 },
      );
    }
    const msg = err instanceof Error ? err.message : 'Görev oluşturulamadı.';
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
