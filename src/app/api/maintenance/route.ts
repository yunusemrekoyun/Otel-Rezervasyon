import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContextFromRequest } from '@/lib/auth/session';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContextFromRequest(request);
    if (!auth || !['admin', 'personel', 'temizlikci'].includes(auth.user.roleSlug)) {
      return NextResponse.json({ ok: false, message: 'Yetkisiz erişim.' }, { status: 403 });
    }

    const reports = await prisma.maintenanceReport.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      include: {
        room: { select: { id: true, name: true, floor: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return NextResponse.json({ ok: true, reports });
  } catch {
    return NextResponse.json({ ok: false, message: 'Raporlar alınamadı.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContextFromRequest(request);
    if (!auth || !['admin', 'personel', 'temizlikci'].includes(auth.user.roleSlug)) {
      return NextResponse.json({ ok: false, message: 'Yetkisiz erişim.' }, { status: 403 });
    }

    const body = await request.json();
    const { roomId, description, priority = 'normal' } = body;

    if (!roomId || !description?.trim()) {
      return NextResponse.json({ ok: false, message: 'Oda ve açıklama zorunludur.' }, { status: 400 });
    }

    const report = await prisma.maintenanceReport.create({
      data: {
        roomId,
        reportedById: auth.user.id,
        description: description.trim(),
        priority,
        status: 'open',
      },
      include: {
        room: { select: { id: true, name: true, floor: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    return NextResponse.json({ ok: true, report }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Rapor oluşturulamadı.';
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
