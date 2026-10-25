import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import { requireApiUser } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  assertSameOrigin,
  handleApiError,
  json,
  parseBody,
} from "@/lib/security";
import { createSerialSlug } from "@/lib/slug";
import { serialSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    enforceRateLimit(`serial:create:${user.id}`, 20, 60 * 60 * 1000);

    const data = await parseBody(req, serialSchema);

    const duplicate = await prisma.serial.findFirst({
      where: {
        authorId: user.id,
        title: data.title,
        description: data.description,
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        coverImage: true,
      },
    });

    if (duplicate) {
      return json({ ok: true, serial: duplicate, duplicate: true }, 200);
    }

    const serial = await prisma.serial.create({
      data: {
        slug: createSerialSlug(data.title),
        title: data.title,
        description: data.description,
        coverImage: data.coverImage ?? null,
        authorId: user.id,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        coverImage: true,
      },
    });

    await writeAudit({
      userId: user.id,
      action: "SERIAL_CREATE",
      entity: "Serial",
      entityId: serial.id,
      req,
      meta: { title: serial.title },
    });

    revalidatePath("/serials");

    return json({ ok: true, serial }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
