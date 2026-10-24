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
import { profileSchema } from "@/lib/validation";

export async function PATCH(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    enforceRateLimit(`profile:update:${user.id}`, 20, 60 * 60 * 1000);

    const data = await parseBody(req, profileSchema);

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: data.name,
        affiliation: data.affiliation ?? null,
        bio: data.bio ?? null,
        avatarImage: data.avatarImage ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        affiliation: true,
        bio: true,
        avatarImage: true,
        memberSince: true,
      },
    });

    await writeAudit({
      userId: user.id,
      action: "PROFILE_UPDATE",
      entity: "User",
      entityId: user.id,
      req,
    });

    return json({ ok: true, user: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
