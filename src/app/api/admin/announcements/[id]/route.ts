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
import { announcementSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const admin = await requireApiUser("ADMIN");
    enforceRateLimit(`announcement:update:${admin.id}`, 60, 60 * 60 * 1000);

    const { id } = await params;
    const data = await parseBody(req, announcementSchema);

    const existing = await prisma.announcement.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw new HttpError(404, "未找到该公告");

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        title: data.title,
        content: data.content,
        pinned: data.pinned,
      },
      select: { id: true, title: true, pinned: true },
    });

    await writeAudit({
      userId: admin.id,
      action: "ANNOUNCEMENT_UPDATE",
      entity: "Announcement",
      entityId: id,
      req,
    });

    revalidatePath("/");
    revalidatePath("/announcements");

    return json({ ok: true, announcement });
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
    enforceRateLimit(`announcement:delete:${admin.id}`, 30, 60 * 60 * 1000);

    const { id } = await params;
    const existing = await prisma.announcement.findUnique({
      where: { id },
      select: { id: true, title: true },
    });
    if (!existing) throw new HttpError(404, "未找到该公告");

    await prisma.announcement.delete({ where: { id } });

    await writeAudit({
      userId: admin.id,
      action: "ANNOUNCEMENT_DELETE",
      entity: "Announcement",
      entityId: id,
      req,
      meta: { title: existing.title },
    });

    revalidatePath("/");
    revalidatePath("/announcements");

    return json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
