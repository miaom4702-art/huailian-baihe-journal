import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { NextRequest } from "next/server";

import { requireApiUser } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  assertSameOrigin,
  handleApiError,
  HttpError,
  json,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;

function detectImage(buffer: Buffer) {
  if (
    buffer.length > 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { ext: "png", mime: "image/png" };
  }
  if (
    buffer.length > 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { ext: "jpg", mime: "image/jpeg" };
  }
  if (
    buffer.length > 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { ext: "webp", mime: "image/webp" };
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    enforceRateLimit(`upload:${user.id}`, 60, 60 * 60 * 1000, "上传过于频繁");

    const formData = await req.formData();
    const file = formData.get("file");

    if (
      !file ||
      typeof file !== "object" ||
      typeof (file as File).arrayBuffer !== "function"
    ) {
      throw new HttpError(400, "请选择要上传的图片");
    }

    const image = file as File;
    if (image.size <= 0) throw new HttpError(422, "图片为空");
    if (image.size > MAX_BYTES) {
      throw new HttpError(413, "单张图片不能超过 8MB");
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const detected = detectImage(buffer);
    if (!detected) {
      throw new HttpError(422, "仅支持 JPG、PNG 或 WebP 图片");
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const filename = `${randomUUID()}.${detected.ext}`;
    await writeFile(path.join(uploadDir, filename), buffer, { flag: "wx" });

    return json({ ok: true, url: `/uploads/${filename}` }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
