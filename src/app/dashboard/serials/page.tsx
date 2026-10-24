import { SerialManager } from "@/components/serial-manager";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardSerialsPage() {
  const user = await requireUser();

  const [serials, available] = await Promise.all([
    prisma.serial.findMany({
      where: { authorId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        articles: {
          where: { deletedAt: null },
          orderBy: [{ serialOrder: "asc" }, { publishedAt: "asc" }],
          select: {
            id: true,
            title: true,
            slug: true,
            publishedAt: true,
          },
        },
      },
    }),
    prisma.article.findMany({
      where: {
        authorId: user.id,
        serialId: null,
        deletedAt: null,
      },
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, slug: true, publishedAt: true },
    }),
  ]);

  return (
    <div>
      <header>
        <p className="eyebrow">My Serials</p>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-ink-900">我的连载</h2>
        <p className="mt-2 text-sm text-ink-700/65">
          把已发表的单篇文章加入自己的连载合集，或调整章节顺序。只能操作自己的文章和合集。
        </p>
      </header>

      <SerialManager
        serials={serials.map((serial) => ({
          id: serial.id,
          title: serial.title,
          slug: serial.slug,
          description: serial.description,
          coverImage: serial.coverImage,
          updatedAt: serial.updatedAt.toISOString(),
          articles: serial.articles.map((article) => ({
            ...article,
            publishedAt: article.publishedAt.toISOString(),
          })),
        }))}
        available={available.map((article) => ({
          ...article,
          publishedAt: article.publishedAt.toISOString(),
        }))}
      />
    </div>
  );
}
