import { prisma } from "./db";
import { getClientIp } from "./security";

type AuditInput = {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  req?: Request;
  meta?: Record<string, unknown>;
};

export async function writeAudit(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        ip: input.req ? getClientIp(input.req) : null,
        meta: input.meta ? JSON.stringify(input.meta).slice(0, 2000) : null,
      },
    });
  } catch (error) {
    console.error("[audit] failed to write log:", error);
  }
}
