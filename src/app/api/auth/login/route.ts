import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

import { createSession, destroySession } from "@/lib/auth";
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
import { loginSchema } from "@/lib/validation";

const DUMMY_HASH =
  "$2a$12$UaDXny3nW6Vg2fDtMhytje/phUjhGqWARM2gQYYMn8o62Pjilmdp2";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const ip = getClientIp(req);
    const data = await parseBody(req, loginSchema);

    enforceRateLimit(`login:ip:${ip}`, 20, 15 * 60 * 1000, "登录尝试过于频繁");
    enforceRateLimit(
      `login:email:${data.email}`,
      8,
      15 * 60 * 1000,
      "该账号尝试次数过多",
    );

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true, name: true, email: true, role: true, passwordHash: true },
    });

    const valid = await bcrypt.compare(
      data.password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !valid) {
      await writeAudit({
        userId: user?.id ?? null,
        action: "AUTH_LOGIN_FAILED",
        entity: "User",
        entityId: user?.id ?? null,
        req,
        meta: { email: data.email },
      });
      throw new HttpError(401, "邮箱或密码不正确");
    }

    await destroySession();
    await createSession(user.id, {
      ip,
      userAgent: req.headers.get("user-agent"),
    });

    await writeAudit({
      userId: user.id,
      action: "AUTH_LOGIN",
      entity: "User",
      entityId: user.id,
      req,
    });

    return json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
