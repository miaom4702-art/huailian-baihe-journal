import { ArticleManager } from "@/components/article-manager";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  await requireRole("ADMIN");

  const [articles, issues, serials] = await Promise.all([
    prisma.article.findMany({
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        abstract: true,
        keywords: true,
        category: true,
        content: true,
        featured: true,
        publishedAt: true,
        deletedAt: true,
        author: { select: { name: true } },
        serial: { select: { id: true, title: true, slug: true } },
        issue: {
          select: {
            id: true,
            title: true,
            year: true,
            volume: true,
            number: true,
            archivedAt: true,
          },
        },
      },
    }),
    prisma.issue.findMany({
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        title: true,
        year: true,
        volume: true,
        number: true,
        archivedAt: true,
      },
    }),
    prisma.serial.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <div>
      <header>
        <p className="eyebrow">Articles</p>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-ink-900">文章管理</h2>
        <p className="mt-2 text-sm text-ink-700/65">
          编辑已刊文章、调整所属期次与首页精选，或软下架文章。保存后首页、文章页与期刊目录会立即同步。
        </p>
      </header>

      <ArticleManager
        articles={articles.map((article) => ({
          id: article.id,
          slug: article.slug,
          title: article.title,
          abstract: article.abstract,
          keywords: article.keywords,
          category: article.category,
          content: article.content,
          featured: article.featured,
          publishedAt: article.publishedAt.toISOString(),
          deletedAt: article.deletedAt?.toISOString() ?? null,
          authorName: article.author.name,
          serial: article.serial,
          issue: article.issue
            ? {
                ...article.issue,
                archivedAt: article.issue.archivedAt?.toISOString() ?? null,
              }
            : null,
        }))}
        issues={issues.map((issue) => ({
          ...issue,
          archivedAt: issue.archivedAt?.toISOString() ?? null,
        }))}
        serials={serials}
      />
    </div>
  );
}
