import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";

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
import { associationSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const admin = await requireApiUser("ADMIN");
    enforceRateLimit(`association:create:${admin.id}`, 30, 60 * 60 * 1000);

    const data = await parseBody(req, associationSchema);

    const association = await prisma.association.create({
      data: {
        name: data.name,
        shortName: data.shortName ?? null,
        description: data.description,
        email: data.email ?? null,
        groupNumber: data.groupNumber ?? null,
        sortOrder: data.sortOrder,
        published: data.published,
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        published: true,
        sortOrder: true,
      },
    });

    await writeAudit({
      userId: admin.id,
      action: "ASSOCIATION_CREATE",
      entity: "Association",
      entityId: association.id,
      req,
    });

    revalidatePath("/");
    revalidatePath("/about");

    return json({ ok: true, association }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
