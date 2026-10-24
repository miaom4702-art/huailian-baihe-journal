import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const articles = await prisma.article.deleteMany();
  const submissions = await prisma.submission.deleteMany();

  await prisma.$executeRawUnsafe(
    "UPDATE Announcement SET title = replace(title, '学刊', '期刊'), content = replace(content, '学刊', '期刊')",
  );
  await prisma.$executeRawUnsafe(
    "UPDATE Issue SET title = replace(title, '学刊', '期刊'), description = replace(description, '学刊', '期刊')",
  );
  await prisma.$executeRawUnsafe(
    "UPDATE User SET bio = replace(bio, '学刊', '期刊') WHERE bio IS NOT NULL",
  );
  await prisma.$executeRawUnsafe(
    "UPDATE MembershipApplication SET reason = replace(reason, '学刊', '期刊')",
  );

  console.log(
    `已清空文章 ${articles.count} 篇、投稿 ${submissions.count} 篇；期刊、公告与账号保留，旧品牌字样已更新。`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
