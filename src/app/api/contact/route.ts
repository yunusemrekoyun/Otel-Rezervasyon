import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContextFromRequest } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().trim().min(1).max(120).default('General inquiry'),
  message: z.string().trim().min(1).max(2000),
});

export async function POST(request: NextRequest) {
  const parsed = contactSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Name and message are required.' },
      { status: 400 },
    );
  }

  const ticketId = `WN-CON-${Date.now().toString(36).toUpperCase()}`;
  const auth = await getAuthContextFromRequest(request).catch(() => null);

  try {
    await prisma.contactRequest.create({
      data: {
        userId: auth?.user.id,
        name: parsed.data.name,
        category: parsed.data.category,
        message: parsed.data.message,
        ticketId,
      },
    });
  } catch (error) {
    console.error('Contact request persistence failed.', error);

    return NextResponse.json(
      { ok: false, message: 'Request could not be stored.' },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    ticketId,
    category: parsed.data.category,
    receivedAt: new Date().toISOString(),
  });
}
