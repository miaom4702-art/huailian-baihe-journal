import { execFile } from "node:child_process";
import path from "node:path";

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { enforceRateLimit } from "@/lib/rate-limit";
import {
  assertSameOrigin,
  getClientIp,
  handleApiError,
  HttpError,
  parseBody,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ttsSchema = z.object({
  text: z.string().trim().min(1).max(1000),
});

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const ip = getClientIp(req);
    enforceRateLimit(`assistant:tts:minute:${ip}`, 15, 60 * 1000, "语音合成太频繁，请稍后再试");
    enforceRateLimit(`assistant:tts:hour:${ip}`, 120, 60 * 60 * 1000, "今天的语音额度已经用完啦");

    const { text } = await parseBody(req, ttsSchema);
    const plainText = text
      .replace(/\*\*/g, "")
      .replace(/[`#>]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 1000);

    if (!plainText) {
      throw new HttpError(422, "没有可朗读的内容");
    }

    const script = path.join(process.cwd(), "scripts", "tts-synth.cjs");
    const audio = await new Promise<Buffer>((resolve, reject) => {
      const child = execFile(
        process.execPath,
        [script],
        {
          encoding: "buffer",
          maxBuffer: 12 * 1024 * 1024,
          timeout: 75_000,
        },
        (error, stdout, stderr) => {
          if (error) {
            console.error("[assistant:tts]", error.message, stderr.toString().slice(0, 200));
            reject(new HttpError(502, "????????????"));
            return;
          }
          resolve(stdout);
        },
      );
      child.stdin?.end(escapeXml(plainText));
    });

    if (!audio.length) {
      throw new HttpError(502, "????????????");
    }

    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.length),
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
