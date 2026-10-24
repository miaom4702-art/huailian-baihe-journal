import Link from "next/link";
import { notFound } from "next/navigation";

import { RevisionForm } from "@/components/revision-form";
import { Breadcrumb } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditArticlePage({ params }: Props) {
  const user = await requireUser();
  const { id } = await params;

  const article = await prisma.article.findFirst({
    where: { id, authorId: user.id, deletedAt: null },
    select: {
      id: true,
      title: true,
      abstract: true,
      keywords: true,
      category: true,
      content: true,
      slug: true,
      revisions: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, title: true, createdAt: true },
      },
    },
  });

  if (!article) notFound();

  const pending = article.revisions[0];

  return (
    <div>
      <Breadcrumb
        items={[
          { href: "/dashboard", label: "作者中心" },
          { href: "/dashboard/articles", label: "文章数据" },
          { label: "修改文章" },
        ]}
      />

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Edit Article</p>
          <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-ink-900">修改文章</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-700/65">
            修改需要重新审核。审核期间原文继续公开；通过后更新，驳回则保持原文不变。
          </p>
        </div>
        <Link
          href={`/articles/${article.slug}`}
          className="text-[11px] text-crimson-600 no-underline"
        >
          查看当前文章 →
        </Link>
      </header>

      <div className="mt-8 max-w-3xl">
        {pending ? (
          <div className="card p-8">
            <p className="font-serif text-xl text-ink-900">修改申请审核中</p>
            <p className="mt-3 text-sm leading-7 text-ink-700/70">
              你在 {formatDateTime(pending.createdAt)} 提交的修改正在等待编辑审核。
              审核期间原文章《{article.title}》继续正常展示。
            </p>
            <p className="mt-2 text-[11px] text-ink-700/45">
              申请标题：{pending.title}
            </p>
            <Link
              href="/dashboard/articles"
              className="btn-outline mt-5 inline-flex"
            >
              返回文章数据
            </Link>
          </div>
        ) : (
          <RevisionForm
            article={{
              id: article.id,
              title: article.title,
              abstract: article.abstract,
              keywords: article.keywords,
              category: article.category,
              content: article.content,
            }}
          />
        )}
      </div>
    </div>
  );
}
