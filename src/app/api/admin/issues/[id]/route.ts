import type { NextRequest } from "next/server";

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
import { issueArchiveSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const admin = await requireApiUser("ADMIN");
    enforceRateLimit(`issue:archive:${admin.id}`, 30, 60 * 60 * 1000);

    const { id } = await params;
    const data = await parseBody(req, issueArchiveSchema);

    const issue = await prisma.issue.findUnique({
      where: { id },
      select: { id: true, title: true, archivedAt: true },
    });

    if (!issue) {
      throw new HttpError(404, "未找到该期期刊");
    }

    const archivedAt = data.action === "ARCHIVE" ? new Date() : null;

    await prisma.issue.update({
      where: { id },
      data: { archivedAt },
    });

    await writeAudit({
      userId: admin.id,
      action: data.action === "ARCHIVE" ? "ISSUE_ARCHIVE" : "ISSUE_RESTORE",
      entity: "Issue",
      entityId: id,
      req,
      meta: {
        title: issue.title,
        previousArchivedAt: issue.archivedAt?.toISOString() ?? null,
      },
    });

    return json({ ok: true, archived: Boolean(archivedAt) });
  } catch (error) {
    return handleApiError(error);
  }
}
