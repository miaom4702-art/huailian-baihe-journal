import type { NextRequest } from "next/server";

import { destroySession, getCurrentUser } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import {
  assertSameOrigin,
  handleApiError,
  json,
} from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const user = await getCurrentUser();
    await destroySession();

    if (user) {
      await writeAudit({
        userId: user.id,
        action: "AUTH_LOGOUT",
        entity: "User",
        entityId: user.id,
        req,
      });
    }

    return json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
