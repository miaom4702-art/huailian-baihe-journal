import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

import { createSession } from "@/lib/auth";
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
import { registerSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const ip = getClientIp(req);
    enforceRateLimit(`register:ip:${ip}`, 5, 15 * 60 * 1000, "注册请求过于频繁");

    const data = await parseBody(req, registerSchema);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
      select: { id: true },
    });
    if (existing) {
      throw new HttpError(409, "该邮箱已注册，请直接登录");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        affiliation: data.affiliation ?? null,
        role: "READER",
      },
      select: { id: true, name: true, email: true, role: true },
    });

    await createSession(user.id, {
      ip,
      userAgent: req.headers.get("user-agent"),
    });

    await writeAudit({
      userId: user.id,
      action: "AUTH_REGISTER",
      entity: "User",
      entityId: user.id,
      req,
    });

    return json({ ok: true, user }, 201);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return json({ error: "该邮箱已注册，请直接登录" }, 409);
    }
    return handleApiError(error);
  }
}
