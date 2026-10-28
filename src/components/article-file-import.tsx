"use client";

import { useRef, useState } from "react";

type Props = {
  onText: (text: string) => void;
  hasContent: boolean;
  disabled?: boolean;
};

type ImportResult = {
  text?: string;
  truncated?: boolean;
  pages?: number;
  filename?: string;
  error?: string;
};

export function ArticleFileImport({ onText, hasContent, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setMessage(null);
    setError(null);

    if (file.size > 15 * 1024 * 1024) {
      setError("文件不能超过 15MB");
      return;
    }

    if (hasContent && !window.confirm("导入会替换当前正文，确定继续吗？")) {
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/import/article", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as ImportResult;
      if (!response.ok || !result.text) {
        setError(result.error ?? "文件读取失败");
        return;
      }

      onText(result.text);
      const pageText = result.pages ? `，${result.pages} 页` : "";
      const truncatedText = result.truncated ? "，已截取前 30000 字" : "";
      setMessage(
        `已导入${result.filename ? `《${result.filename}》` : ""}${pageText}，共 ${result.text.length} 字${truncatedText}`,
      );
    } catch {
      setError("文件上传失败，请检查网络后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-sm border border-ink-900/10 bg-paper-100/35 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold text-ink-900">从 TXT / PDF 导入正文</p>
          <p className="mt-1 text-[10px] leading-5 text-ink-700/55">
            只提取文字，不保存原文件；扫描版 PDF 需要先 OCR。正文上限 30000 字。
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.pdf,text/plain,application/pdf"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void handleFile(file);
          }}
        />
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => inputRef.current?.click()}
          className="btn-outline whitespace-nowrap !px-3 !py-1.5 text-[11px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "读取中…" : "选择文件"}
        </button>
      </div>
      {message && <p className="mt-2 text-[10px] leading-5 text-ink-700/65">{message}</p>}
      {error && <p className="mt-2 text-[10px] leading-5 text-crimson-700">{error}</p>}
    </div>
  );
}
