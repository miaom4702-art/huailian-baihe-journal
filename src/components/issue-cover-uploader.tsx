"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function IssueCoverUploader({
  issueId,
  coverImage,
  editable,
}: {
  issueId: string;
  coverImage: string | null;
  editable: boolean;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(coverImage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const uploadResult = (await uploadResponse.json()) as {
        url?: string;
        error?: string;
      };
      if (!uploadResponse.ok || !uploadResult.url) {
        setError(uploadResult.error ?? "封面上传失败");
        return;
      }

      const response = await fetch(`/api/admin/issues/${issueId}/cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImage: uploadResult.url }),
      });
      const result = (await response.json()) as {
        coverImage?: string | null;
        error?: string;
      };
      if (!response.ok) {
        setError(result.error ?? "封面保存失败");
        return;
      }
      setCurrent(result.coverImage ?? null);
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  async function removeCover() {
    if (!window.confirm("确定恢复该期的默认封面吗？")) return;
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/issues/${issueId}/cover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImage: null }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "操作失败");
        return;
      }
      setCurrent(null);
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-24">
      <div className="relative aspect-[3/4] overflow-hidden rounded-sm border border-ink-900/10 bg-ink-950">
        {current ? (
          <Image
            src={current}
            alt="期刊封面"
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[linear-gradient(160deg,#173a50,#0b2233)] font-serif text-lg text-paper-50/60">
            期刊
          </div>
        )}
      </div>

      {editable && (
        <>
          <label className="mt-1 block cursor-pointer text-center text-[10px] text-crimson-600">
            {loading ? "处理中…" : "更换封面"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              disabled={loading}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) upload(file);
              }}
            />
          </label>
          {current && (
            <button
              type="button"
              onClick={removeCover}
              disabled={loading}
              className="mt-0.5 block w-full text-center text-[10px] text-ink-700/45 hover:text-crimson-600 disabled:opacity-50"
            >
              恢复默认
            </button>
          )}
          {error && (
            <p className="mt-1 text-[9px] leading-4 text-crimson-600">{error}</p>
          )}
        </>
      )}
    </div>
  );
}
