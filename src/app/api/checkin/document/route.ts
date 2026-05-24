import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getAuthContextFromRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { saveFile } from '@/lib/media/storage';

export const runtime = 'nodejs';

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg':       'jpg',
  'image/jpg':        'jpg',
  'image/png':        'png',
  'image/webp':       'webp',
  'application/pdf':  'pdf',
};

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  const auth = await getAuthContextFromRequest(request).catch(() => null);
  if (!auth) return NextResponse.json({ ok: false }, { status: 401 });
  if (!['admin', 'personel'].includes(auth.user.roleSlug)) {
    return NextResponse.json({ ok: false, message: 'Yetkisiz.' }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ ok: false, message: 'Geçersiz form.' }, { status: 400 });
  }

  const file           = formData.get('file') as File | null;
  const confirmationId = formData.get('confirmationId') as string | null;

  if (!file || !confirmationId) {
    return NextResponse.json(
      { ok: false, message: 'file ve confirmationId zorunlu.' },
      { status: 400 },
    );
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { ok: false, message: 'Sadece PDF, JPG, PNG ve WebP kabul edilir.' },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { ok: false, message: "Dosya 10 MB'dan büyük olamaz." },
      { status: 400 },
    );
  }

  const reservation = await prisma.reservation.findUnique({
    where:  { confirmationId },
    select: { id: true },
  });
  if (!reservation) {
    return NextResponse.json(
      { ok: false, message: 'Rezervasyon bulunamadı.' },
      { status: 404 },
    );
  }

  const fileName = `${randomUUID()}.${ext}`;
  const buffer   = Buffer.from(await file.arrayBuffer());

  await saveFile(buffer, fileName, 'checkin-docs');

  const url = `/uploads/checkin-docs/${fileName}`;

  await prisma.reservation.update({
    where: { confirmationId },
    data:  { checkinDocumentUrl: url },
  });

  return NextResponse.json({ ok: true, url });
}
