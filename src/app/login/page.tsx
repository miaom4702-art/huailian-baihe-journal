import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { safeNextPath } from "@/lib/utils";

export const metadata: Metadata = { title: "登录" };
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const params = await searchParams;
  const next = safeNextPath(params.next);

  return (
    <div className="wrap grid gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-24">
      <section className="hidden lg:block">
        <p className="eyebrow">Welcome back</p>
        <h1 className="mt-4 font-serif text-4xl leading-snug tracking-wide text-ink-900">
          欢迎回到
          <br />
          百合的书桌。
        </h1>
        <p className="mt-5 max-w-md text-sm leading-8 text-ink-700/70">
          登录后，你可以提交稿件、查看审稿进度、管理入会申请，
          编辑与管理员还可以进入后台处理稿件。
        </p>
        <div className="mt-10 border-l-2 border-gold-400/60 pl-5">
          <p className="font-serif text-[15px] leading-7 text-ink-900/75">
            “写作是一件孤独的事，
            <br />
            但校对标点的时候，我们会坐在一起。”
          </p>
        </div>
      </section>

      <section className="card mx-auto w-full max-w-md p-7 sm:p-9">
        <p className="eyebrow">Sign in</p>
        <h2 className="mt-2 font-serif text-2xl text-ink-900">登录</h2>
        <p className="mt-2 text-xs text-ink-700/60">
          使用注册邮箱登录。连续失败会触发临时限制。
        </p>
        <div className="mt-7">
          <AuthForm mode="login" next={next} />
        </div>

        {process.env.NODE_ENV !== "production" && (
          <div className="mt-7 rounded-sm bg-paper-100 px-4 py-3 text-[10px] leading-6 text-ink-700/55">
            演示账号：author@hlbh.org / Author@HLBH2026
            <br />
            编辑账号：editor@hlbh.org / Editor@HLBH2026
            <br />
            管理账号：admin@hlbh.org / Admin@HLBH2026
          </div>
        )}

        <p className="mt-5 text-center text-[10px] text-ink-700/40">
          <Link href="/" className="no-underline hover:text-crimson-600">
            ← 返回首页
          </Link>
        </p>
      </section>
    </div>
  );
}
