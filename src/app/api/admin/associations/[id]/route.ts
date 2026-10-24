import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

import { requireApiUser } from "@/lib/api-auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  assertSameOrigin,
  handleApiError,
  HttpError,
  json,
  parseBody,
} from "@/lib/security";
import { associationSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const admin = await requireApiUser("ADMIN");
    enforceRateLimit(`association:update:${admin.id}`, 60, 60 * 60 * 1000);

    const { id } = await params;
    const data = await parseBody(req, associationSchema);

    const existing = await prisma.association.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new HttpError(404, "未找到该协会");

    const association = await prisma.association.update({
      where: { id },
      data: {
        name: data.name,
        shortName: data.shortName ?? null,
        description: data.description,
        email: data.email ?? null,
        groupNumber: data.groupNumber ?? null,
        sortOrder: data.sortOrder,
        published: data.published,
      },
      select: { id: true, name: true, published: true },
    });

    await writeAudit({
      userId: admin.id,
      action: "ASSOCIATION_UPDATE",
      entity: "Association",
      entityId: id,
      req,
    });

    revalidatePath("/");
    revalidatePath("/about");

    return json({ ok: true, association });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const admin = await requireApiUser("ADMIN");
    enforceRateLimit(`association:delete:${admin.id}`, 30, 60 * 60 * 1000);

    const { id } = await params;
    const existing = await prisma.association.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!existing) throw new HttpError(404, "未找到该协会");

    await prisma.association.delete({ where: { id } });

    await writeAudit({
      userId: admin.id,
      action: "ASSOCIATION_DELETE",
      entity: "Association",
      entityId: id,
      req,
      meta: { name: existing.name },
    });

    revalidatePath("/");
    revalidatePath("/about");

    return json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
