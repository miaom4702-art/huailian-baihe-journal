import { AnnouncementManager } from "@/components/announcement-manager";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncementsPage() {
  await requireRole("ADMIN");

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      title: true,
      content: true,
      pinned: true,
      publishedAt: true,
    },
  });

  return (
    <div>
      <header>
        <p className="eyebrow">Announcements</p>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-ink-900">公告管理</h2>
        <p className="mt-2 text-sm text-ink-700/65">
          发布、编辑、置顶或删除公告。保存后首页和公告页会立即同步。
        </p>
      </header>

      <AnnouncementManager
        announcements={announcements.map((item) => ({
          ...item,
          publishedAt: item.publishedAt.toISOString(),
        }))}
      />
    </div>
  );
}
