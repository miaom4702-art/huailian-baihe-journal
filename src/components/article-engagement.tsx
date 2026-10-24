"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatDateTime } from "@/lib/utils";

type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  userName: string;
  avatarImage: string | null;
  canDelete: boolean;
};

type Props = {
  slug: string;
  initialLikes: number;
  initialLiked: boolean;
  comments: CommentItem[];
  isLoggedIn: boolean;
  loginHref: string;
};

export function ArticleEngagement({
  slug,
  initialLikes,
  initialLiked,
  comments,
  isLoggedIn,
  loginHref,
}: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(initialLikes);
  const [likeLoading, setLikeLoading] = useState(false);
  const [content, setContent] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleLike() {
    if (!isLoggedIn) {
      router.push(loginHref);
      return;
    }
    setError(null);
    setLikeLoading(true);
    try {
      const response = await fetch(`/api/articles/${slug}/like`, {
        method: liked ? "DELETE" : "POST",
      });
      const result = (await response.json()) as {
        liked?: boolean;
        count?: number;
        error?: string;
      };
      if (!response.ok) {
        setError(result.error ?? "操作失败");
        return;
      }
      setLiked(Boolean(result.liked));
      if (typeof result.count === "number") setLikes(result.count);
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLikeLoading(false);
    }
  }

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isLoggedIn) {
      router.push(loginHref);
      return;
    }
    if (!content.trim()) return;

    setError(null);
    setCommentLoading(true);
    try {
      const response = await fetch(`/api/articles/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "评论失败");
        return;
      }
      setContent("");
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setCommentLoading(false);
    }
  }

  async function deleteComment(id: string) {
    if (!window.confirm("确定删除这条评论吗？")) return;
    setError(null);
    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "删除失败");
        return;
      }
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    }
  }

  return (
    <section className="mt-12 border-t border-ink-900/10 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Discussion</p>
          <h2 className="mt-2 font-serif text-2xl text-ink-900">互动与评论</h2>
        </div>
        <button
          type="button"
          onClick={toggleLike}
          disabled={likeLoading}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition-colors disabled:opacity-50 ${
            liked
              ? "border-crimson-600 bg-crimson-600 text-white"
              : "border-ink-900/20 text-ink-800 hover:border-crimson-600 hover:text-crimson-600"
          }`}
        >
          <span>{liked ? "已赞" : "点赞"}</span>
          <span className="opacity-70">{likes}</span>
        </button>
      </div>

      {!isLoggedIn && (
        <p className="mt-4 text-xs text-ink-700/55">
          登录后可以点赞和评论。
          <Link href={loginHref} className="ml-1 text-crimson-600 no-underline">
            去登录 →
          </Link>
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-sm border border-crimson-600/25 bg-crimson-600/5 px-3 py-2 text-xs text-crimson-700">
          {error}
        </p>
      )}

      {isLoggedIn && (
        <form onSubmit={submitComment} className="mt-6">
          <label className="label" htmlFor="comment-content">
            写下你的评论
          </label>
          <textarea
            id="comment-content"
            className="input min-h-28 resize-y"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={1000}
            placeholder="友善交流，尊重作者与其他读者。"
            required
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[10px] text-ink-700/40">
              {content.length} / 1000
            </span>
            <button
              type="submit"
              className="btn-primary !px-4 !py-2 text-xs"
              disabled={commentLoading || !content.trim()}
            >
              {commentLoading ? "发布中…" : "发布评论"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700/45">
          评论 {comments.length}
        </p>
        {comments.length === 0 ? (
          <p className="mt-4 text-sm text-ink-700/50">
            还没有评论，来写下第一条吧。
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {comments.map((comment) => (
              <li
                key={comment.id}
                className="rounded-sm border border-ink-900/10 bg-white/60 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {comment.avatarImage ? (
                      <Image
                        src={comment.avatarImage}
                        alt={comment.userName}
                        width={56}
                        height={56}
                        unoptimized
                        className="h-7 w-7 rounded-full border border-ink-900/10 object-cover"
                      />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900/5 font-serif text-[11px] text-ink-800">
                        {comment.userName.slice(0, 1)}
                      </span>
                    )}
                    <span className="text-[11px] font-medium text-ink-900">
                      {comment.userName}
                    </span>
                    <span className="text-[10px] text-ink-700/40">
                      {formatDateTime(comment.createdAt)}
                    </span>
                  </div>
                  {comment.canDelete && (
                    <button
                      type="button"
                      onClick={() => deleteComment(comment.id)}
                      className="text-[10px] text-ink-700/40 hover:text-crimson-600"
                    >
                      删除
                    </button>
                  )}
                </div>
                <p className="mt-3 whitespace-pre-line text-[13px] leading-7 text-ink-900/80">
                  {comment.content}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
