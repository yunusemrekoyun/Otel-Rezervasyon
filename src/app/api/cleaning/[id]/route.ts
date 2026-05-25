import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthContextFromRequest } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/audit';

export const runtime = 'nodejs';

const cleaningUpdateSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'done']).optional(),
  priority: z.enum(['normal', 'urgent']).optional(),
  notes: z.string().max(1000).nullable().optional(),
  assignedToId: z.string().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthContextFromRequest(request);
    if (!auth || !['admin', 'personel', 'temizlikci'].includes(auth.user.roleSlug)) {
      return NextResponse.json({ ok: false, message: 'Yetkisiz erişim.' }, { status: 403 });
    }

    const { id } = await params;
    const parsed = cleaningUpdateSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, message: 'Temizlik görevi bilgileri geçersiz.' }, { status: 400 });
    }
    const body = parsed.data;

    const existing = await prisma.cleaningTask.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, message: 'Görev bulunamadı.' }, { status: 404 });
    }

    // Kat hizmetleri only can update their own tasks' status
    if (auth.user.roleSlug === 'temizlikci') {
      if (existing.assignedToId !== auth.user.id) {
        return NextResponse.json({ ok: false, message: 'Bu görev size atanmamış.' }, { status: 403 });
      }
      if (body.status === undefined) {
        return NextResponse.json({ ok: false, message: 'Yetkisiz alan.' }, { status: 403 });
      }
      if (body.priority !== undefined || body.notes !== undefined || body.assignedToId !== undefined) {
        return NextResponse.json({ ok: false, message: 'Yetkisiz alan.' }, { status: 403 });
      }
    }

    const isDone = body.status === 'done';

    const task = await prisma.$transaction(async tx => {
      const t = await tx.cleaningTask.update({
        where: { id },
        data: {
          ...(body.status       !== undefined && { status:       body.status }),
          ...(body.priority     !== undefined && { priority:     body.priority }),
          ...(body.notes        !== undefined && { notes:        body.notes || null }),
          ...(body.assignedToId !== undefined && { assignedToId: body.assignedToId || null }),
          ...(isDone && { completedAt: new Date() }),
        },
        include: {
          room: { select: { id: true, name: true, floor: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      });

      // When task is done → restore room to available (if no other pending tasks)
      if (isDone) {
        const pending = await tx.cleaningTask.count({
          where: { roomId: t.roomId, status: { not: 'done' }, id: { not: id } },
        });
        const room = await tx.room.findUnique({
          where: { id: t.roomId },
          select: { status: true },
        });
        if (pending === 0 && room?.status === 'cleaning') {
          await tx.room.update({ where: { id: t.roomId }, data: { status: 'available' } });
        }
      }

      return t;
    });

    await writeAuditLog({
      request,
      auth,
      action: isDone ? 'cleaning.done' : 'cleaning.update',
      entityType: 'cleaning_task',
      entityId: task.id,
      summary: isDone ? `Temizlik görevi tamamlandı: oda ${task.room.name}` : `Temizlik görevi güncellendi: oda ${task.room.name}`,
      before: {
        status: existing.status,
        priority: existing.priority,
        assignedToId: existing.assignedToId,
      },
      after: {
        status: task.status,
        priority: task.priority,
        assignedToId: task.assignedToId,
      },
    });

    return NextResponse.json({ ok: true, task });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Güncelleme başarısız.';
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getAuthContextFromRequest(request);
    if (!auth || !['admin', 'personel'].includes(auth.user.roleSlug)) {
      return NextResponse.json({ ok: false, message: 'Yetkisiz erişim.' }, { status: 403 });
    }

    const { id } = await params;
    const task = await prisma.cleaningTask.findUnique({ where: { id }, select: { roomId: true } });
    if (!task) return NextResponse.json({ ok: false, message: 'Görev bulunamadı.' }, { status: 404 });

    await prisma.$transaction(async tx => {
      await tx.cleaningTask.delete({ where: { id } });
      const remaining = await tx.cleaningTask.count({ where: { roomId: task.roomId, status: { not: 'done' } } });
      const room = await tx.room.findUnique({ where: { id: task.roomId }, select: { status: true } });
      if (remaining === 0 && room?.status === 'cleaning') {
        await tx.room.update({ where: { id: task.roomId }, data: { status: 'available' } });
      }
    });

    await writeAuditLog({
      request,
      auth,
      action: 'cleaning.delete',
      entityType: 'cleaning_task',
      entityId: id,
      summary: 'Temizlik görevi silindi.',
      before: { roomId: task.roomId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Silme başarısız.';
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
