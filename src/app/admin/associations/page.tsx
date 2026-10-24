import { AssociationManager } from "@/components/association-manager";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminAssociationsPage() {
  await requireRole("ADMIN");

  const associations = await prisma.association.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div>
      <header>
        <p className="eyebrow">Associations</p>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-ink-900">协会与社团</h2>
        <p className="mt-2 text-sm text-ink-700/65">
          维护关联网站展示的协会/社团资料。隐藏后前台不再展示，删除不可恢复。
        </p>
      </header>

      <AssociationManager
        associations={associations.map((item) => ({
          id: item.id,
          name: item.name,
          shortName: item.shortName,
          description: item.description,
          email: item.email,
          groupNumber: item.groupNumber,
          sortOrder: item.sortOrder,
          published: item.published,
        }))}
      />
    </div>
  );
}
