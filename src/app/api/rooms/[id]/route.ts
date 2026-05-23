import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthContextFromRequest } from '@/lib/auth/session';

export const runtime = 'nodejs';

/** PATCH: Update room status or details (admin only) */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContextFromRequest(request);
    if (!authContext || authContext.user.roleSlug !== 'admin') {
      return NextResponse.json({ ok: false, message: 'Yetkisiz erişim.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const room = await prisma.room.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.floor !== undefined && { floor: body.floor }),
        ...(body.basePrice !== undefined && { basePrice: body.basePrice }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.roomTypeId !== undefined && { roomTypeId: body.roomTypeId }),
      },
      include: {
        roomType: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ ok: true, room });
  } catch (error) {
    console.error('Room update error:', error);
    return NextResponse.json({ ok: false, message: 'Oda güncellenirken hata oluştu.' }, { status: 500 });
  }
}

/** DELETE: Delete a room (admin only) */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContextFromRequest(request);
    if (!authContext || authContext.user.roleSlug !== 'admin') {
      return NextResponse.json({ ok: false, message: 'Yetkisiz erişim.' }, { status: 403 });
    }

    const { id } = await params;
    await prisma.room.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Room delete error:', error);
    return NextResponse.json({ ok: false, message: 'Oda silinirken hata oluştu.' }, { status: 500 });
  }
}
