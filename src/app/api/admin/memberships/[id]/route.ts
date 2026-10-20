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
import { membershipReviewSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const editor = await requireApiUser("EDITOR");
    enforceRateLimit(`membership:review:${editor.id}`, 60, 60 * 60 * 1000);

    const { id } = await params;
    const data = await parseBody(req, membershipReviewSchema);

    const application = await prisma.membershipApplication.findUnique({
      where: { id },
      select: { id: true, status: true, userId: true },
    });

    if (!application) {
      throw new HttpError(404, "未找到该申请");
    }
    if (application.status !== "PENDING") {
      throw new HttpError(409, "该申请已处理");
    }

    const now = new Date();
    const nextStatus = data.action === "APPROVE" ? "APPROVED" : "REJECTED";

    await prisma.$transaction(async (tx) => {
      await tx.membershipApplication.update({
        where: { id },
        data: {
          status: nextStatus,
          reviewNote: data.note ?? null,
          reviewedById: editor.id,
          reviewedAt: now,
        },
      });

      if (data.action === "APPROVE" && application.userId) {
        await tx.user.update({
          where: { id: application.userId },
          data: { memberSince: now },
        });
      }
    });

    await writeAudit({
      userId: editor.id,
      action: "MEMBERSHIP_REVIEW",
      entity: "MembershipApplication",
      entityId: id,
      req,
      meta: { status: nextStatus },
    });

    return json({ ok: true, status: nextStatus });
  } catch (error) {
    return handleApiError(error);
  }
}
