import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  assertSameOrigin,
  getClientIp,
  handleApiError,
  HttpError,
  json,
  parseBody,
} from "@/lib/security";
import { membershipSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const ip = getClientIp(req);
    enforceRateLimit(`membership:ip:${ip}`, 3, 60 * 60 * 1000, "申请提交过于频繁");

    const user = await getCurrentUser();
    if (user?.memberSince) {
      throw new HttpError(409, "你已经是正式会员，无需重复申请");
    }

    const data = await parseBody(req, membershipSchema);
    enforceRateLimit(
      `membership:email:${data.email}`,
      2,
      24 * 60 * 60 * 1000,
      "该邮箱今日申请次数过多",
    );

    const pending = await prisma.membershipApplication.findFirst({
      where: { email: data.email, status: "PENDING" },
      select: { id: true },
    });
    if (pending) {
      throw new HttpError(409, "该邮箱已有待审核的申请，请耐心等待");
    }

    const application = await prisma.membershipApplication.create({
      data: {
        userId: user?.id ?? null,
        name: data.name,
        email: data.email,
        studentId: data.studentId ?? null,
        school: data.school,
        major: data.major ?? null,
        reason: data.reason,
        status: "PENDING",
      },
      select: { id: true, createdAt: true, status: true },
    });

    await writeAudit({
      userId: user?.id ?? null,
      action: "MEMBERSHIP_APPLY",
      entity: "MembershipApplication",
      entityId: application.id,
      req,
    });

    return json({ ok: true, application }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
