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
import { roleSchema } from "@/lib/validation";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(req);
    const admin = await requireApiUser("ADMIN");
    enforceRateLimit(`role:change:${admin.id}`, 20, 60 * 60 * 1000);

    const { id } = await params;
    if (id === admin.id) {
      throw new HttpError(400, "不能修改自己的角色，避免权限丢失");
    }

    const data = await parseBody(req, roleSchema);

    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, email: true },
    });
    if (!target) {
      throw new HttpError(404, "未找到该用户");
    }

    await prisma.user.update({
      where: { id },
      data: { role: data.role },
    });

    await writeAudit({
      userId: admin.id,
      action: "USER_ROLE_CHANGE",
      entity: "User",
      entityId: id,
      req,
      meta: { from: target.role, to: data.role, email: target.email },
    });

    return json({ ok: true, role: data.role });
  } catch (error) {
    return handleApiError(error);
  }
}
