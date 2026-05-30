import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAuthContextFromRequest } from '@/lib/auth/session';
import { renderBrandedMail, sendMail } from '@/lib/mail';

export const runtime = 'nodejs';

const replySchema = z.object({
  adminReply: z.string().trim().min(1).max(2000),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthContextFromRequest(request).catch(() => null);
  if (!auth || !['admin', 'personel'].includes(auth.user.roleSlug)) {
    return NextResponse.json({ ok: false, message: 'Yetkisiz.' }, { status: 403 });
  }

  const parsed = replySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Yanıt metni gerekli.' }, { status: 400 });
  }

  const { id } = await params;

  const contact = await prisma.contactRequest.findUnique({ where: { id } });
  if (!contact) {
    return NextResponse.json({ ok: false, message: 'Talep bulunamadı.' }, { status: 404 });
  }

  const updated = await prisma.contactRequest.update({
    where: { id },
    data: {
      adminReply:  parsed.data.adminReply,
      repliedAt:   new Date(),
      repliedById: auth.user.id,
    },
  });

  const customerEmail = contact.email;
  if (customerEmail) {
    const { html, text } = renderBrandedMail({
      title: `Destek talebiniz yanıtlandı — ${contact.ticketId}`,
      preview: 'Garden Hotel destek ekibi mesajınıza yanıt verdi.',
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
