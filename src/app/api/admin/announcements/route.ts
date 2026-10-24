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
import { announcementSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const admin = await requireApiUser("ADMIN");
    enforceRateLimit(`announcement:create:${admin.id}`, 30, 60 * 60 * 1000);

    const data = await parseBody(req, announcementSchema);

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        pinned: data.pinned,
        authorId: admin.id,
      },
      select: { id: true, title: true, pinned: true, publishedAt: true },
    });

    await writeAudit({
      userId: admin.id,
      action: "ANNOUNCEMENT_CREATE",
      entity: "Announcement",
      entityId: announcement.id,
      req,
    });

    revalidatePath("/");
    revalidatePath("/announcements");

    return json({ ok: true, announcement }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
