import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "注册" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="wrap grid gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
      <section className="card mx-auto w-full max-w-md p-7 sm:p-9">
        <p className="eyebrow">Create account</p>
        <h2 className="mt-2 font-serif text-2xl text-ink-900">注册账号</h2>
        <p className="mt-2 text-xs text-ink-700/60">
          注册后可投稿、申请入会并查看审稿进度。
        </p>
        <div className="mt-7">
          <AuthForm mode="register" />
        </div>
        <p className="mt-5 text-[10px] leading-6 text-ink-700/45">
          注册即表示你同意编辑部为稿件处理目的保存账号信息。
          如仅希望浏览文章，无需注册。
        </p>
      </section>

      <section className="hidden lg:block">
        <p className="eyebrow">Join the circle</p>
        <h1 className="mt-4 font-serif text-4xl leading-snug tracking-wide text-ink-900">
          从一个账号开始，
          <br />
          慢慢成为共同体。
        </h1>
        <p className="mt-5 max-w-md text-sm leading-8 text-ink-700/70">
          账号只是入口。真正重要的，是你愿不愿意把一篇稿子改到第三遍，
          愿不愿意在读书会上听完一个与你不同的判断。
        </p>
        <div className="mt-10 space-y-3 text-xs text-ink-700/60">
          {[
            "投稿与审稿进度追踪",
            "入会申请与会员活动报名",
            "编辑与审稿工作台（按角色开放）",
          ].map((item) => (
            <p key={item} className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-crimson-600" />
              {item}
            </p>
          ))}
        </div>
        <p className="mt-8 text-[11px] text-ink-700/45">
          已有账号？{" "}
          <Link href="/login" className="text-crimson-600 no-underline">
            直接登录
          </Link>
        </p>
      </section>
    </div>
  );
}
