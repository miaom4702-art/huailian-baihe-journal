"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatDate } from "@/lib/utils";

type Props = {
  name: string;
  email: string;
  affiliation: string | null;
  bio: string | null;
  avatarImage: string | null;
  memberSince: string | null;
};

export function ProfileForm({
  name,
  email,
  affiliation,
  bio,
  avatarImage,
  memberSince,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name,
    affiliation: affiliation ?? "",
    bio: bio ?? "",
    avatarImage: avatarImage ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function uploadAvatar(file: File) {
    setError(null);
    setSaved(false);
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !result.url) {
        setError(result.error ?? "头像上传失败");
        return;
      }
      setForm((current) => ({ ...current, avatarImage: result.url ?? "" }));
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "保存失败");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <form onSubmit={submit} className="card space-y-4 p-6" noValidate>
        <div>
          <span className="label">头像</span>
          <div className="flex items-center gap-4">
            {form.avatarImage ? (
              <Image
                src={form.avatarImage}
                alt="头像预览"
                width={128}
                height={128}
                unoptimized
                className="h-16 w-16 rounded-full border border-ink-900/10 object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-900/5 font-serif text-2xl text-ink-700">
                {form.name.slice(0, 1) || "百"}
              </span>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="btn-outline cursor-pointer !px-3 !py-1.5 text-[11px]">
                {avatarUploading ? "上传中…" : "上传头像"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={avatarUploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) uploadAvatar(file);
                  }}
                />
              </label>
              {form.avatarImage && (
                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({ ...current, avatarImage: "" }))
                  }
                  className="text-left text-[10px] text-ink-700/45 hover:text-crimson-600"
                >
                  移除头像
                </button>
              )}
              <p className="text-[10px] text-ink-700/40">
                JPG / PNG / WebP，≤8MB；点击底部保存生效
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="profile-name">
            昵称 / 笔名
          </label>
          <input
            id="profile-name"
            className="input"
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            required
            minLength={2}
            maxLength={40}
          />
        </div>

        <div>
          <label className="label" htmlFor="profile-email">
            邮箱
          </label>
          <input
            id="profile-email"
            className="input bg-paper-100/60 text-ink-700/60"
            value={email}
            disabled
          />
          <p className="mt-1 text-[10px] text-ink-700/45">
            邮箱用于登录，暂不支持自行修改。
          </p>
        </div>

        <div>
          <label className="label" htmlFor="profile-affiliation">
            院系 / 单位（选填）
          </label>
          <input
            id="profile-affiliation"
            className="input"
            value={form.affiliation}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                affiliation: event.target.value,
              }))
            }
            maxLength={80}
          />
        </div>

        <div>
          <label className="label" htmlFor="profile-bio">
            个人简介（选填）
          </label>
          <textarea
            id="profile-bio"
            className="input min-h-28 resize-y"
            value={form.bio}
            onChange={(event) =>
              setForm((current) => ({ ...current, bio: event.target.value }))
            }
            maxLength={300}
          />
        </div>

        {error && (
          <p className="rounded-sm border border-crimson-600/25 bg-crimson-600/5 px-3 py-2 text-xs text-crimson-700">
            {error}
          </p>
        )}
        {saved && (
          <p className="rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            资料已更新。
          </p>
        )}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "保存中…" : "保存资料"}
        </button>
      </form>

      <aside className="space-y-4">
        <div className="card p-5">
          <h3 className="font-serif text-base text-ink-900">账号信息</h3>
          <dl className="mt-3 space-y-2 text-[11px]">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-700/50">邮箱</dt>
              <dd className="truncate text-ink-800">{email}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-700/50">会员身份</dt>
              <dd className="text-ink-800">
                {memberSince
                  ? `正式会员 · ${formatDate(memberSince, false)}`
                  : "非正式会员"}
              </dd>
            </div>
          </dl>
        </div>

        <p className="text-[11px] leading-6 text-ink-700/45">
          昵称会显示在文章作者、页头和作者中心。修改后，历史文章的署名也会同步更新。
        </p>
      </aside>
    </div>
  );
}
