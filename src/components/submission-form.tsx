"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { ArticleFileImport } from "@/components/article-file-import";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";

type SerialOption = {
  id: string;
  title: string;
  coverImage: string | null;
};

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/uploads", {
    method: "POST",
    body: formData,
  });
  const result = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !result.url) {
    throw new Error(result.error ?? "图片上传失败");
  }
  return result.url;
}

export function SubmissionForm({ serials }: { serials: SerialOption[] }) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [contentLength, setContentLength] = useState(0);
  const [done, setDone] = useState(false);

  const [serialChoice, setSerialChoice] = useState("");
  const [serialTitle, setSerialTitle] = useState("");
  const [serialDescription, setSerialDescription] = useState("");
  const [serialCover, setSerialCover] = useState("");
  const [illustrations, setIllustrations] = useState<string[]>([]);

  const creatingSerial = serialChoice === "__new__";

  function resetExtras() {
    setSerialChoice("");
    setSerialTitle("");
    setSerialDescription("");
    setSerialCover("");
    setIllustrations([]);
  }

  async function onCoverChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      setSerialCover(await uploadImage(file));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "封面上传失败",
      );
    } finally {
      setUploading(false);
    }
  }

  async function onIllustrationsChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setError(null);
    setUploading(true);
    try {
      const remaining = Math.max(0, 6 - illustrations.length);
      const accepted = files.slice(0, remaining);
      if (files.length > remaining) {
        setError("最多上传 6 张插图");
      }
      const urls: string[] = [];
      for (const file of accepted) {
        urls.push(await uploadImage(file));
      }
      setIllustrations((current) => [...current, ...urls].slice(0, 6));
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : "插图上传失败",
      );
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (creatingSerial && serialTitle.trim().length < 2) {
      setError("请为连载合集填写至少 2 个字的标题");
      return;
    }
    if (creatingSerial && serialDescription.trim().length < 10) {
      setError("连载合集简介至少 10 个字");
      return;
    }

    if (submittingRef.current) return;
    submittingRef.current = true;

    const form = event.currentTarget;
    const formData = new FormData(form);
    setLoading(true);

    try {
      let serialId: string | null =
        serialChoice && serialChoice !== "__new__" ? serialChoice : null;

      if (creatingSerial) {
        const serialResponse = await fetch("/api/serials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: serialTitle,
            description: serialDescription,
            coverImage: serialCover || undefined,
          }),
        });
        const serialResult = (await serialResponse.json()) as {
          serial?: { id: string };
          error?: string;
        };
        if (!serialResponse.ok || !serialResult.serial) {
          setError(serialResult.error ?? "创建连载合集失败");
          return;
        }
        serialId = serialResult.serial.id;
      }

      const payload = {
        title: String(formData.get("title") ?? ""),
        abstract: String(formData.get("abstract") ?? ""),
        keywords: String(formData.get("keywords") ?? ""),
        category: String(formData.get("category") ?? ""),
        content: String(formData.get("content") ?? ""),
        serialId,
        illustrations,
      };

      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "投稿失败，请稍后再试");
        return;
      }

      form.reset();
      setContentLength(0);
      resetExtras();
      setDone(true);
      router.refresh();
    } catch {
      setError("网络异常，请检查连接后重试");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card p-8 text-center sm:p-12">
        <span className="font-serif text-4xl text-crimson-600">收</span>
        <h2 className="mt-4 font-serif text-2xl text-ink-900">稿件已送达编辑部</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-ink-700/75">
          我们会在 30 日内完成初审，并通过站内状态更新通知你。你可以随时在作者中心查看审稿进度。
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className="btn-primary">
            前往作者中心
          </Link>
          <button type="button" onClick={() => setDone(false)} className="btn-outline">
            再投一篇
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-6 sm:p-9" noValidate>
      <div>
        <label className="label" htmlFor="title">
          稿件标题
        </label>
        <input
          id="title"
          name="title"
          className="input"
          required
          minLength={4}
          maxLength={120}
          placeholder="简洁、准确地概括文章主题"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="category">
            投稿栏目
          </label>
          <select id="category" name="category" className="input" required>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="keywords">
            关键词
          </label>
          <input
            id="keywords"
            name="keywords"
            className="input"
            required
            maxLength={120}
            placeholder="以分号分隔，如：同人；日常；校园"
          />
        </div>
      </div>

      <div className="rounded-sm border border-ink-900/10 bg-paper-100/40 p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700/55">
          连载合集（选填）
        </p>
        <p className="mt-1 text-[11px] leading-6 text-ink-700/55">
          将本文放入一个连载合集，合集与章节会一并出现在编辑部的审稿列表中。新建合集时可以上传封面。
        </p>

        <div className="mt-4">
          <label className="label" htmlFor="serial-choice">
            选择合集
          </label>
          <select
            id="serial-choice"
            className="input"
            value={serialChoice}
            onChange={(event) => setSerialChoice(event.target.value)}
          >
            <option value="">不加入连载合集</option>
            {serials.map((serial) => (
              <option key={serial.id} value={serial.id}>
                {serial.title}
              </option>
            ))}
            <option value="__new__">＋ 新建连载合集</option>
          </select>
        </div>

        {creatingSerial && (
          <div className="mt-4 space-y-4 border-t border-ink-900/10 pt-4">
            <div>
              <label className="label" htmlFor="serial-title">
                合集标题
              </label>
              <input
                id="serial-title"
                className="input"
                value={serialTitle}
                onChange={(event) => setSerialTitle(event.target.value)}
                required
                minLength={2}
                maxLength={80}
                placeholder="例如：月台尽头的夏天"
              />
            </div>
            <div>
              <label className="label" htmlFor="serial-description">
                合集简介
              </label>
              <textarea
                id="serial-description"
                className="input min-h-24 resize-y"
                value={serialDescription}
                onChange={(event) => setSerialDescription(event.target.value)}
                required
                minLength={10}
                maxLength={1000}
                placeholder="介绍这个连载系列的主题、人物或更新计划"
              />
            </div>
            <div>
              <label className="label" htmlFor="serial-cover">
                合集封面（选填，JPG/PNG/WebP，≤8MB）
              </label>
              <input
                id="serial-cover"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="block w-full text-xs text-ink-700/70 file:mr-3 file:rounded-sm file:border-0 file:bg-ink-900 file:px-3 file:py-2 file:text-xs file:text-paper-50"
                onChange={onCoverChange}
                disabled={uploading}
              />
              {serialCover && (
                <div className="mt-3 flex items-center gap-3">
                  <Image
                    src={serialCover}
                    alt="连载封面预览"
                    width={160}
                    height={100}
                    unoptimized
                    className="h-24 w-40 rounded-sm border border-ink-900/10 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setSerialCover("")}
                    className="text-[11px] text-ink-700/55 hover:text-crimson-600"
                  >
                    移除封面
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {serialChoice && serialChoice !== "__new__" && (
          <p className="mt-3 text-[11px] text-crimson-700/70">
            本文将作为该连载的一章提交，编辑可以在稿件处理里一并看到合集信息。
          </p>
        )}
      </div>

      <div>
        <label className="label" htmlFor="abstract">
          摘要（选填，建议 30 字以上）
        </label>
        <textarea
          id="abstract"
          name="abstract"
          className="input min-h-32 resize-y"
          maxLength={800}
          placeholder="建议 30 字以上，简要说明故事内容或创作背景；不填写也可以提交"
        />
      </div>

      <div>
        <label className="label" htmlFor="content">
          正文
        </label>
        <div className="mb-3">
          <ArticleFileImport
            hasContent={contentLength > 0}
            disabled={loading || uploading}
            onText={(text) => {
              if (contentRef.current) contentRef.current.value = text;
              setContentLength(text.length);
            }}
          />
        </div>
        <textarea
          ref={contentRef}
          id="content"
          name="content"
          className="input min-h-80 resize-y font-serif leading-7"
          required
          minLength={200}
          maxLength={30000}
          onChange={(event) => setContentLength(event.target.value.length)}
          placeholder="请粘贴正文，或从上方导入 TXT / PDF。段落之间空一行。插图请使用下方单独的上传窗口。"
        />
      </div>

      <div>
        <label className="label" htmlFor="illustrations">
          文章插图（选填，最多 6 张，显示在正文末尾）
        </label>
        <input
          id="illustrations"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="block w-full text-xs text-ink-700/70 file:mr-3 file:rounded-sm file:border-0 file:bg-ink-900 file:px-3 file:py-2 file:text-xs file:text-paper-50"
          onChange={onIllustrationsChange}
          disabled={uploading || illustrations.length >= 6}
        />
        {illustrations.length > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {illustrations.map((url) => (
              <div key={url} className="relative">
                <Image
                  src={url}
                  alt="文章插图预览"
                  width={320}
                  height={200}
                  unoptimized
                  className="h-24 w-full rounded-sm border border-ink-900/10 object-cover"
                />
                <button
                  type="button"
                  onClick={() =>
                    setIllustrations((current) =>
                      current.filter((item) => item !== url),
                    )
                  }
                  className="absolute right-1 top-1 rounded-full bg-ink-950/70 px-2 py-0.5 text-[10px] text-paper-50"
                >
                  移除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {uploading && (
        <p className="text-[11px] text-crimson-700/70">图片上传中，请稍候…</p>
      )}

      {error && (
        <p className="rounded-sm border border-crimson-600/25 bg-crimson-600/5 px-3 py-2 text-xs leading-6 text-crimson-700">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <span className="text-[11px] text-ink-700/50">
          摘要选填；带 * 项为必填
        </span>
        <button
          type="submit"
          className="btn-crimson"
          disabled={loading || uploading}
        >
          {loading ? "正在提交…" : uploading ? "图片上传中…" : "提交稿件"}
        </button>
      </div>
    </form>
  );
}
