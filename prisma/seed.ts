import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "Admin@HLBH2026";
const EDITOR_PASSWORD = "Editor@HLBH2026";
const AUTHOR_PASSWORD = "Author@HLBH2026";

async function main() {
  console.log("正在清空旧数据 ...");
  await prisma.auditLog.deleteMany();
  await prisma.reviewRecord.deleteMany();
  await prisma.article.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.membershipApplication.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  console.log("正在创建用户 ...");
  const [adminHash, editorHash, authorHash] = await Promise.all([
    bcrypt.hash(ADMIN_PASSWORD, 12),
    bcrypt.hash(EDITOR_PASSWORD, 12),
    bcrypt.hash(AUTHOR_PASSWORD, 12),
  ]);

  const admin = await prisma.user.create({
    data: {
      email: "admin@hlbh.org",
      name: "江寄北",
      passwordHash: adminHash,
      role: "ADMIN",
      affiliation: "淮安大学文学院",
      bio: "《淮联百合学刊》主编，研究方向为中国现当代文学与地方文献。",
      memberSince: new Date("2016-09-01"),
    },
  });

  const editor = await prisma.user.create({
    data: {
      email: "editor@hlbh.org",
      name: "沈知微",
      passwordHash: editorHash,
      role: "EDITOR",
      affiliation: "淮安大学人文学院",
      bio: "编辑部副主任，负责散文与艺术评论栏目。",
      memberSince: new Date("2018-03-12"),
    },
  });

  const author = await prisma.user.create({
    data: {
      email: "author@hlbh.org",
      name: "林清和",
      passwordHash: authorHash,
      role: "READER",
      affiliation: "淮安大学文学院 2024 级硕士",
      bio: "写作者，关注运河沿岸的地方记忆与植物意象。",
      memberSince: new Date("2024-10-08"),
    },
  });

  const author2 = await prisma.user.create({
    data: {
      email: "su@hlbh.org",
      name: "苏晚晴",
      passwordHash: authorHash,
      role: "READER",
      affiliation: "淮安大学新闻传播学院",
      bio: "校园媒体编辑，研究青年亚文化与同人出版。",
      memberSince: new Date("2023-05-20"),
    },
  });

  console.log("正在创建期刊 ...");
  const issue1 = await prisma.issue.create({
    data: {
      volume: 1,
      number: 1,
      year: 2025,
      title: "创刊号：百合与青春",
      theme: "文学、记忆与校园",
      description:
        "创刊号以“百合与青春”为专题，收录同道们的散文、诗歌与地方文化随笔，亦可视为同好会十年的一次集体自述。",
      publishedAt: new Date("2025-06-15"),
    },
  });

  const issue2 = await prisma.issue.create({
    data: {
      volume: 1,
      number: 2,
      year: 2025,
      title: "秋日书简",
      theme: "书信、行旅与地方",
      description:
        "第二期以“秋日书简”为题，讨论书信体写作与运河行旅，试图在缓慢的文体中重新理解人与地方的关系。",
      publishedAt: new Date("2025-11-20"),
    },
  });

  const issue3 = await prisma.issue.create({
    data: {
      volume: 2,
      number: 1,
      year: 2026,
      title: "生长的年轮",
      theme: "青年写作与共同体",
      description:
        "本期聚焦青年写作的现场，兼及社团史料的整理与口述史方法，附“百合杯”获奖作品小辑。",
      publishedAt: new Date("2026-04-18"),
    },
  });

  console.log("正在创建已刊发文章 ...");
  const publishedSeeds = [
    {
      authorId: author.id,
      issueId: issue1.id,
      slug: "lily-imagery-in-huai-an-literature",
      title: "百合花意象在淮安地方文学中的流变",
      abstract:
        "本文以近三十年淮安地方报刊与校园刊物为材料，梳理百合花意象从“纯洁象征”到“地方共同体的情感标记”的转义过程，并讨论校园写作者如何在日常经验中重新发明这一符号。",
      keywords: "百合意象；地方文学；校园写作；符号转义",
      category: "LITERATURE",
      featured: true,
      publishedAt: new Date("2025-06-15"),
      content: `一、问题的提出

百合在淮安的地方书写中并不总是主角。它更多时候出现在校园刊物的边角、毕业纪念册的扉页，或者某个暮春傍晚的短句里。然而正是这种低密度的出现，使它成为一种可以被反复征用的情感符号。

二、从花卉志到情感志

早期的地方副刊多把百合作为观赏植物来处理，笔调接近花卉志。九十年代以后，随着校园文学社的兴起，百合开始与青春期、离别和承诺发生关联。写作者不再满足于描写花的形态，而是把它当作一种可以寄放私人记忆的容器。

三、共同体标记的形成

进入本世纪，同好会的年度刊物逐渐把百合固定为视觉与命名的核心。每年五月，成员会在刊物扉页手写一句短笺，这些短笺后来被整理成“百合书简”专栏。百合由此完成了从私人意象到共同体标记的转换。

四、结语

地方文学中的植物意象从来不是静止的。百合的流变提示我们：所谓地方性，并非封闭的风景，而是一代人持续不断的命名实践。`,
    },
    {
      authorId: author2.id,
      issueId: issue1.id,
      slug: "canal-bridges-anthropology",
      title: "淮安运河段古桥群的建筑人类学考察",
      abstract:
        "本文以淮安运河段现存十二座古桥为对象，结合地方档案与匠人口述，讨论桥体形制、材料选择与沿岸社群生活之间的关系，尝试提出一种“桥作为日常基础设施”的观察路径。",
      keywords: "淮安运河；古桥；建筑人类学；口述史",
      category: "HISTORY",
      featured: true,
      publishedAt: new Date("2025-06-15"),
      content: `一、田野与方法

调查自二〇二四年秋开始，历时七个月。我们沿运河步行，记录桥体尺度、石材来源与修缮痕迹，并访谈了十四位沿岸居民与两位老石匠。

二、桥的三种尺度

桥首先是工程的尺度：跨度、拱高与水位之间的关系，决定了它的寿命。其次是生活的尺度：桥头常年聚集着修鞋摊、菜贩与下棋的老人。最后是记忆的尺度：许多人能准确说出某座桥哪一年被加固，却记不清自己第一次过桥的年纪。

三、作为基础设施的桥

把桥理解为基础设施，意味着关注它如何组织日常流动，而不仅是它的建筑美学。桥的磨损、修补与临时封闭，都会在沿岸社群的作息中留下痕迹。

四、余论

古桥保护不应只停留在立面修缮。真正需要被延续的，是桥与人的使用关系。`,
    },
    {
      authorId: author2.id,
      issueId: issue2.id,
      slug: "zine-editing-ethics",
      title: "校园同人志的编辑伦理与共同体建构",
      abstract:
        "本文基于淮联百合同好会刊物的编辑实践，讨论校园同人志在匿名写作、退稿沟通与版权处理方面的伦理困境，并提出以“可撤回的授权”为核心的编辑原则。",
      keywords: "同人志；编辑伦理；校园出版；共同体",
      category: "CULTURE",
      featured: false,
      publishedAt: new Date("2025-11-20"),
      content: `一、同人志的双重身份

校园同人志既是文学文本，也是社群仪式。编辑在其中扮演的角色，往往介于审稿人与朋友之间，这使得常规的编辑伦理需要被重新讨论。

二、匿名与署名

匿名写作保护了表达的勇气，也可能削弱责任意识。我们的做法是允许笔名发表，但要求作者向编辑部提供真实身份，并约定在涉及事实争议时协助核实。

三、退稿的沟通

退稿信不应只是结论。编辑部逐步形成“一段具体建议 + 一个可操作方向”的写法，并在征得作者同意后为其保留修改重投的通道。

四、可撤回的授权

作者授权应明确期限、范围与撤回方式。刊物数字化之后，这一点尤其重要。我们主张将授权视为持续的关系，而非一次性的让渡。

五、结语

共同体的维系，靠的不是统一的审美，而是可以持续协商的规则。`,
    },
    {
      authorId: author.id,
      issueId: issue2.id,
      slug: "lily-aesthetics-in-book-of-songs",
      title: "从《诗经》草木看百合的审美转义",
      abstract:
        "本文从《诗经》草木比兴的传统出发，考察百合在历代注疏与近现代植物学命名中的意义变化，指出其审美意涵始终与知识分类的变动相互纠缠。",
      keywords: "诗经；草木；百合；名物考据；审美",
      category: "LITERATURE",
      featured: false,
      publishedAt: new Date("2025-11-20"),
      content: `一、名与物之间

《诗经》中的草木之名，往往难以与现代植物学分类一一对应。百合的情况尤为复杂，它在不同注疏系统中指向的植物并不完全一致。

二、比兴的剩余

比兴并不只是修辞技术，它还保留了对物性的观察。百合的鳞茎、花期与气味，在注疏中被反复提及，这些细节构成了审美转义的物质基础。

三、近现代的分类迁移

随着植物学知识的引入，百合逐渐获得了稳定的物种身份。但文学写作中的百合，仍然携带着旧有注疏的残余意义。

四、小结

名物考据的意义，不在于给出唯一答案，而在于呈现意义生成的层次。`,
    },
    {
      authorId: editor.id,
      issueId: issue3.id,
      slug: "small-place-narrative",
      title: "青年写作中的“小地方”叙事",
      abstract:
        "本文讨论近年青年写作中反复出现的“小地方”叙事，分析其空间经验、语言策略与情感结构，并反思“地方”被浪漫化的风险。",
      keywords: "青年写作；小地方；空间叙事；地方性",
      category: "ART",
      featured: true,
      publishedAt: new Date("2026-04-18"),
      content: `一、什么是“小地方”

“小地方”不是一个地理学概念，而是一种被叙述出来的尺度感。它通常意味着有限的活动半径、稠密的人际关系，以及难以摆脱的熟人目光。

二、空间的写法

青年作者倾向于用具体的店名、公交线路和天气来标记空间。这些细节让文本获得了可信度，也可能沦为地方志式的罗列。

三、情感的悖论

离开与返回是“小地方”叙事的常见结构。作者既渴望外部世界，又对故乡保有道德上的愧疚。这种悖论构成了文本的情感张力。

四、警惕浪漫化

把“小地方”写成未被污染的乌托邦，是一种新的惰性。真正有力量的写作，应当呈现地方内部的裂隙与冲突。

五、结语

地方不是背景，而是人物行动的条件。写作者需要做的，是让空间参与叙事，而不是装饰叙事。`,
    },
    {
      authorId: admin.id,
      issueId: issue3.id,
      slug: "ten-years-of-hlbh",
      title: "淮联百合同好会十年活动纪略",
      abstract:
        "本文以社团档案、活动海报与成员口述为依据，整理淮联百合同好会自成立以来的主要活动与刊物出版情况，为后续社团史研究提供基础材料。",
      keywords: "社团史；淮联百合同好会；校园文化；档案整理",
      category: "NEWS",
      featured: false,
      publishedAt: new Date("2026-04-18"),
      content: `一、草创（2016—2018）

同好会最初只是文学院走廊上的一次读书会。二〇一六年秋，七位同学在图书馆旧馆三楼约定每月共读一本小说，并在年末油印了第一本小册子。

二、扩展（2019—2022）

随着成员增加，活动逐渐分化为读书会、写作工坊与年度刊物三条线。二〇二一年起，同好会开始与校外书店合作举办朗诵会。

三、刊物（2023—2026）

《淮联百合学刊》前身为内部交流册，二〇二五年正式创刊。截至本期，已出版三卷，累计刊发文章四十余篇。

四、档案说明

本文所用材料存于同好会资料室，部分海报与手稿已数字化。欢迎知情者补充与订正。`,
    },
  ];

  for (const seed of publishedSeeds) {
    const submission = await prisma.submission.create({
      data: {
        userId: seed.authorId,
        title: seed.title,
        abstract: seed.abstract,
        keywords: seed.keywords,
        category: seed.category,
        content: seed.content,
        status: "PUBLISHED",
        assignedEditorId: editor.id,
        createdAt: new Date(seed.publishedAt.getTime() - 1000 * 60 * 60 * 24 * 40),
        publishedAt: seed.publishedAt,
        reviews: {
          create: [
            {
              editorId: editor.id,
              action: "SUBMIT",
              note: "作者投稿，进入初审。",
              createdAt: new Date(seed.publishedAt.getTime() - 1000 * 60 * 60 * 24 * 40),
            },
            {
              editorId: editor.id,
              action: "ACCEPT",
              note: "选题与刊物定位契合，建议刊发。",
              createdAt: new Date(seed.publishedAt.getTime() - 1000 * 60 * 60 * 24 * 20),
            },
            {
              editorId: admin.id,
              action: "PUBLISH",
              note: "已完成三校，刊发于本期。",
              createdAt: seed.publishedAt,
            },
          ],
        },
      },
    });

    await prisma.article.create({
      data: {
        slug: seed.slug,
        title: seed.title,
        abstract: seed.abstract,
        keywords: seed.keywords,
        category: seed.category,
        content: seed.content,
        featured: seed.featured,
        views: 40 + Math.floor(Math.random() * 260),
        publishedAt: seed.publishedAt,
        submissionId: submission.id,
        authorId: seed.authorId,
        issueId: seed.issueId,
      },
    });
  }

  console.log("正在创建审稿中的投稿 ...");
  await prisma.submission.create({
    data: {
      userId: author.id,
      title: "运河船工号子的采集与整理札记",
      abstract:
        "本文记录二〇二六年春夏两季在淮安运河段采集船工号子的过程，附采录说明、曲词整理与若干方法反思。",
      keywords: "船工号子；田野录音；非遗；运河",
      category: "HISTORY",
      content:
        "一、缘起\n\n二〇二六年四月，我们在清江浦一带遇到仍在从事航运的老人。交谈中得知，完整的船工号子已经很难听到。\n\n二、采集方法\n\n我们采用半结构化访谈与现场录音相结合的方式，共完成九次访谈，累计录音七小时。\n\n三、初步整理\n\n号子的曲词多与水流、风向和装卸有关，具有明显的劳动节奏。部分唱词存在不同版本，需要进一步比对。\n\n四、方法反思\n\n录音并不等于保存。如何让这些声音回到具体的生活场景，是后续工作的重点。",
      status: "UNDER_REVIEW",
      assignedEditorId: editor.id,
      createdAt: new Date("2026-09-12"),
      reviews: {
        create: {
          editorId: editor.id,
          action: "SUBMIT",
          note: "作者投稿，已分配责任编辑。",
          createdAt: new Date("2026-09-12"),
        },
      },
    },
  });

  await prisma.submission.create({
    data: {
      userId: author2.id,
      title: "短视频时代的地方影像志：一次校园实验",
      abstract:
        "本文结合校园影像工作坊的实践，讨论短视频媒介如何改变地方影像的记录方式，以及青年创作者在其中面临的速度焦虑。",
      keywords: "短视频；影像志；地方；媒介实践",
      category: "CULTURE",
      content:
        "一、项目背景\n\n工作坊在2026年春季学期启动，共有十二位同学参与，完成短片九部。\n\n二、媒介的速度\n\n短视频的时长限制改变了叙事节奏，也改变了拍摄者对“值得记录”的判断。\n\n三、地方的可见性\n\n镜头让一些日常空间变得可见，同时也可能把复杂的地方经验压缩为标签。\n\n四、结语\n\n影像志的价值，或许在于保留犹豫和停顿，而不是追求即时的传播效果。",
      status: "SUBMITTED",
      createdAt: new Date("2026-10-02"),
      reviews: {
        create: {
          editorId: editor.id,
          action: "SUBMIT",
          note: "新投稿，待初审。",
          createdAt: new Date("2026-10-02"),
        },
      },
    },
  });

  console.log("正在创建公告 ...");
  await prisma.announcement.createMany({
    data: [
      {
        title: "《淮联百合学刊》2026 年第 2 期征稿启事",
        content:
          "本期专题为“地方记忆的当代表达”，欢迎文学研究、历史考据、文化观察与艺术评论类稿件。来稿请附摘要、关键词与作者简介，篇幅以 4000—12000 字为宜。截稿日期：2026 年 12 月 20 日。",
        pinned: true,
        authorId: admin.id,
        publishedAt: new Date("2026-09-28"),
      },
      {
        title: "第九届“百合杯”校园文学奖征稿",
        content:
          "本届文学奖设小说、散文、诗歌三组，面向淮安大学全体在校生。投稿请注明组别与联系方式，每人限投两篇。评审结果将于 2027 年 3 月公布。",
        pinned: true,
        authorId: editor.id,
        publishedAt: new Date("2026-09-15"),
      },
      {
        title: "编辑部换届与审稿流程说明",
        content:
          "自 2026 年秋季学期起，编辑部实行“初审—外审—终审”三审制。所有来稿将在 30 日内给出初审意见；需修改的稿件请按意见逐条回复。感谢同道们的信任与耐心。",
        pinned: false,
        authorId: admin.id,
        publishedAt: new Date("2026-08-30"),
      },
    ],
  });

  console.log("正在创建会员申请 ...");
  await prisma.membershipApplication.create({
    data: {
      userId: author.id,
      name: "林清和",
      email: "author@hlbh.org",
      studentId: "2024110108",
      school: "淮安大学文学院",
      major: "中国现当代文学",
      reason:
        "希望参与学刊的编辑与读书会活动，并在地方文献整理方面做一些基础工作。",
      status: "PENDING",
      createdAt: new Date("2026-10-05"),
    },
  });

  console.log("正在写入审计日志 ...");
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: "SEED_INIT",
        entity: "SYSTEM",
        ip: "127.0.0.1",
        meta: JSON.stringify({ note: "初始化演示数据" }),
        createdAt: new Date("2026-10-01T08:00:00Z"),
      },
      {
        userId: editor.id,
        action: "ARTICLE_PUBLISH",
        entity: "Article",
        entityId: "ten-years-of-hlbh",
        ip: "127.0.0.1",
        meta: JSON.stringify({ issue: "2026-2-1" }),
        createdAt: new Date("2026-04-18T10:20:00Z"),
      },
    ],
  });

  console.log("\n种子数据完成。");
  console.log("管理员：admin@hlbh.org / " + ADMIN_PASSWORD);
  console.log("编辑：  editor@hlbh.org / " + EDITOR_PASSWORD);
  console.log("作者：  author@hlbh.org / " + AUTHOR_PASSWORD);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
