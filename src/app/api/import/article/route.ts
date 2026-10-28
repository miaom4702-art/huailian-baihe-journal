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

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_TEXT_LENGTH = 30_000;

function normalizeTxt(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeTxt(buffer: ArrayBuffer) {
  const utf8 = new TextDecoder("utf-8").decode(buffer);
  if (!utf8.includes("\uFFFD")) return utf8;

  try {
    return new TextDecoder("gb18030").decode(buffer);
  } catch {
    return utf8;
  }
}

function normalizePdf(value: string) {
  const cleaned = value
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .split("\n")
    .map((line) =>
      line
        .replace(/[ \t]+/g, " ")
        .replace(/(?<=[\u3400-\u9fff])\s+(?=[\u3400-\u9fff])/g, "")
        .replace(/(?<=[\u3400-\u9fff])\s+(?=[，。！？；：、）」』】…—])/g, "")
        .replace(/(?<=[（「『【])\s+(?=[\u3400-\u9fff])/g, "")
        .trim(),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    assertSameOrigin(req);
    const user = await requireApiUser();
    enforceRateLimit(`import:article:${user.id}`, 20, 60 * 60 * 1000, "导入过于频繁，请稍后再试");

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      throw new HttpError(422, "请选择要导入的 TXT 或 PDF 文件");
    }
    if (file.size === 0) {
      throw new HttpError(422, "文件是空的");
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new HttpError(413, "文件不能超过 15MB");
    }

    const lowerName = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");
    const isTxt =
      file.type === "text/plain" ||
      file.type === "text/txt" ||
      lowerName.endsWith(".txt");

    if (!isPdf && !isTxt) {
      throw new HttpError(415, "只支持 TXT 或 PDF 文件");
    }

    const buffer = await file.arrayBuffer();
    let text = "";
    let pages: number | undefined;

    if (isPdf) {
      try {
        const { extractText, getDocumentProxy } = await import("unpdf");
        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        const result = await extractText(pdf, { mergePages: true });
        pages = result.totalPages;
        text = normalizePdf(result.text);
      } catch {
        throw new HttpError(
          422,
          "无法读取这个 PDF。请确认它是文字版 PDF，而不是扫描图片；扫描版需要先做 OCR。",
        );
      }
    } else {
      text = normalizeTxt(decodeTxt(buffer));
    }

    if (!text) {
      throw new HttpError(
        422,
        isPdf
          ? "这个 PDF 没有可提取的文字，可能是扫描版图片。"
          : "这个 TXT 文件没有可读取的文字。",
      );
    }

    const truncated = text.length > MAX_TEXT_LENGTH;
    return json({
      ok: true,
      text: text.slice(0, MAX_TEXT_LENGTH),
      truncated,
      pages,
      filename: file.name,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
