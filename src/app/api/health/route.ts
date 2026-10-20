import { prisma } from "@/lib/db";
import { json } from "@/lib/security";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return json({
      status: "ok",
      service: "huailian-baihe-journal",
      time: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[health] database check failed:", error);
    return json({ status: "degraded" }, 503);
  }
}
