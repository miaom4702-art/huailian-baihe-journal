import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 90);
  }
  return (
    req.headers.get("x-real-ip")?.slice(0, 90) ??
    req.headers.get("cf-connecting-ip")?.slice(0, 90) ??
    "unknown"
  );
}

export function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;

  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    req.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function assertSameOrigin(req: Request) {
  if (!isSameOrigin(req)) {
    throw new HttpError(403, "请求来源校验失败，请刷新页面后重试");
  }
}

export async function parseBody<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<T> {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    throw new HttpError(400, "请求体不是合法的 JSON");
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new HttpError(422, result.error.issues[0]?.message ?? "输入内容有误");
  }
  return result.data;
}

export function handleApiError(error: unknown) {
  if (error instanceof HttpError) {
    return json({ error: error.message }, error.status);
  }

  if (error instanceof ZodError) {
    return json(
      { error: error.issues[0]?.message ?? "输入内容有误" },
      422,
    );
  }

  console.error("[api] unhandled error:", error);
  return json({ error: "服务器内部错误，请稍后再试" }, 500);
}
