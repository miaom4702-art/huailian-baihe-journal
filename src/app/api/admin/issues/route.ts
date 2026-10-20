import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";

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
import { issueSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const editor = await requireApiUser("EDITOR");
    enforceRateLimit(`issue:create:${editor.id}`, 10, 60 * 60 * 1000);

    const data = await parseBody(req, issueSchema);
    const publishedAt = data.publishedAt
      ? new Date(`${data.publishedAt}T00:00:00+08:00`)
      : new Date();

    const issue = await prisma.issue.create({
      data: {
        year: data.year,
        volume: data.volume,
        number: data.number,
        title: data.title,
        theme: data.theme ?? null,
        description: data.description ?? null,
        publishedAt,
      },
      select: {
        id: true,
        year: true,
        volume: true,
        number: true,
        title: true,
      },
    });

    await writeAudit({
      userId: editor.id,
      action: "ISSUE_CREATE",
      entity: "Issue",
      entityId: issue.id,
      req,
    });

    return json({ ok: true, issue }, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return json({ error: "该年份、卷号与期号已存在" }, 409);
    }
    return handleApiError(error);
  }
}
