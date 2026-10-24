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
import { issueCoverSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    enforceRateLimit(`serial:cover:${user.id}`, 30, 60 * 60 * 1000);

    const { id } = await params;
    const data = await parseBody(req, issueCoverSchema);
    const isAdmin = user.role === "ADMIN";

    const serial = await prisma.serial.findFirst({
      where: isAdmin ? { id } : { id, authorId: user.id },
      select: { id: true, slug: true, title: true, coverImage: true },
    });
    if (!serial) throw new HttpError(404, "未找到该连载合集");

    await prisma.serial.update({
      where: { id },
      data: { coverImage: data.coverImage ?? null },
    });

    await writeAudit({
      userId: user.id,
      action: "SERIAL_COVER",
      entity: "Serial",
      entityId: id,
      req,
      meta: {
        title: serial.title,
        previousCover: serial.coverImage,
      },
    });

    revalidatePath("/serials");
    revalidatePath(`/serials/${serial.slug}`);
    revalidatePath("/admin/serials");
    revalidatePath("/dashboard/serials");

    return json({ ok: true, coverImage: data.coverImage ?? null });
  } catch (error) {
    return handleApiError(error);
  }
}
