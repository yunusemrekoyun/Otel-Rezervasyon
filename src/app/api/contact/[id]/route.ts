import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthContextFromRequest } from '@/lib/auth/session';
import { renderBrandedMail, sendMail } from '@/lib/mail';

export const runtime = 'nodejs';

const patchSchema = z.object({
  adminReply: z.string().trim().min(1).max(2000).optional(),
  status: z.enum(['open', 'resolved']).optional(),
}).refine((d) => d.adminReply !== undefined || d.status !== undefined, {
  message: 'Güncellenecek bir alan gönderin.',
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthContextFromRequest(request).catch(() => null);
  if (!auth || !['admin', 'personel'].includes(auth.user.roleSlug)) {
    return NextResponse.json({ ok: false, message: 'Yetkisiz.' }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Geçersiz istek.' }, { status: 400 });
  }

  const { id } = await params;

  const contact = await prisma.contactRequest.findUnique({ where: { id } });
  if (!contact) {
    return NextResponse.json({ ok: false, message: 'Talep bulunamadı.' }, { status: 404 });
  }

  const updated = await prisma.contactRequest.update({
    where: { id },
    data: {
      ...(parsed.data.adminReply !== undefined ? {
        adminReply:  parsed.data.adminReply,
        repliedAt:   new Date(),
        repliedById: auth.user.id,
      } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
    },
  });

  const customerEmail = contact.email;
  if (parsed.data.adminReply !== undefined && customerEmail) {
    const { html, text } = renderBrandedMail({
      title: `Destek talebiniz yanıtlandı — ${contact.ticketId}`,
      preview: 'Kütahya Garden Otel destek ekibi mesajınıza yanıt verdi.',
      intro: `Merhaba ${contact.name}, ${contact.ticketId} numaralı destek talebinize yanıt alındı.`,
      lines: [
        `Yanıt: ${parsed.data.adminReply}`,
        'Başka sorularınız için yeni bir talep oluşturabilirsiniz.',
      ],
    });
    sendMail({
      to: customerEmail,
      subject: `Destek talebiniz yanıtlandı — ${contact.ticketId}`,
      html,
      text,
    }).catch(console.error);
  }

  return NextResponse.json({ ok: true, contact: updated });
}
