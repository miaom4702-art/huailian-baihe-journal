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
import { submissionSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    enforceRateLimit(`submission:${user.id}`, 8, 60 * 60 * 1000, "投稿过于频繁");

    const data = await parseBody(req, submissionSchema);

    if (data.serialId) {
      const serial = await prisma.serial.findFirst({
        where: { id: data.serialId, authorId: user.id },
        select: { id: true },
      });
      if (!serial) {
        throw new HttpError(422, "连载合集不存在或不属于当前账号");
      }
    }

    const submission = await prisma.submission.create({
      data: {
        userId: user.id,
        title: data.title,
        abstract: data.abstract ?? "",
        keywords: data.keywords,
        category: data.category,
        content: data.content,
        serialId: data.serialId ?? null,
        illustrations: JSON.stringify(data.illustrations ?? []),
        status: "SUBMITTED",
        reviews: {
          create: {
            editorId: user.id,
            action: "SUBMIT",
            note: "作者提交稿件。",
          },
        },
      },
      select: { id: true, title: true, status: true, createdAt: true },
    });

    await writeAudit({
      userId: user.id,
      action: "SUBMISSION_CREATE",
      entity: "Submission",
      entityId: submission.id,
      req,
      meta: { category: data.category },
    });

    return json({ ok: true, submission }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
