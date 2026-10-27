import type { NextRequest } from "next/server";
import { z } from "zod";

import {
  buildAssistantSystemPrompt,
  detectMood,
} from "@/lib/assistant-persona";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  assertSameOrigin,
  getClientIp,
  handleApiError,
  HttpError,
  json,
  parseBody,
} from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
});

type UpstreamResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);

    const ip = getClientIp(req);
    enforceRateLimit(`assistant:minute:${ip}`, 10, 60 * 1000, "八千代需要稍微休息一下");
    enforceRateLimit(`assistant:hour:${ip}`, 80, 60 * 60 * 1000, "今天的对话额度已经用完啦");

    const body = await parseBody(req, chatSchema);
    if (body.messages.at(-1)?.role !== "user") {
      throw new HttpError(422, "最后一条消息必须来自用户");
    }

    const apiKey = process.env.DASHSCOPE_API_KEY?.trim();
    if (!apiKey) {
      throw new HttpError(503, "八千代还在准备中，请稍后再来");
    }

    const baseUrl = (
      process.env.DASHSCOPE_BASE_URL?.trim() ||
      "https://dashscope.aliyuncs.com/compatible-mode/v1"
    ).replace(/\/+$/, "");
    const model = process.env.DASHSCOPE_MODEL?.trim() || "qwen-plus";

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: buildAssistantSystemPrompt() },
          ...body.messages.slice(-12),
        ],
        temperature: 0.85,
        max_tokens: 550,
      }),
      signal: AbortSignal.timeout(35_000),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("[assistant] upstream status:", response.status);
      throw new HttpError(502, "八千代暂时没有回应，请稍后再试");
    }

    const result = (await response.json()) as UpstreamResponse;
    const reply = result.choices?.[0]?.message?.content?.trim().slice(0, 1800);
    if (!reply) {
      throw new HttpError(502, "八千代暂时没有回应，请稍后再试");
    }

    return json({ reply, mood: detectMood(reply) });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return json({ error: "八千代想了太久，请稍后再试" }, 504);
    }
    return handleApiError(error);
  }
}
