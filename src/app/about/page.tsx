import Link from "next/link";

import { Badge } from "@/components/ui";
import { prisma } from "@/lib/db";
import { SITE_CONTACT_EMAIL, SITE_GROUP_NUMBER } from "@/lib/site";

export const metadata = {
  title: "关于",
  description:
    "《淮联百合期刊》由淮安大学淮联百合同好会主办，坚持专业性与可读性并重，关注校园写作与地方记忆。",
};

const board = [
  { name: "江寄北", role: "主编", affiliation: "淮安大学文学院" },
  { name: "沈知微", role: "副主编", affiliation: "淮安大学人文学院" },
  { name: "林清和", role: "编辑", affiliation: "中国现当代文学" },
  { name: "苏晚晴", role: "编辑", affiliation: "新闻传播学院" },
  { name: "顾南枝", role: "特约审稿人", affiliation: "地方文献研究室" },
  { name: "程砚秋", role: "美术指导", affiliation: "视觉传达设计系" },
];

const sections = [
  {
    title: "同人",
    text: "基于既有作品、人物或世界观的二次创作，欢迎短文、片段与完整的同人故事。",
  },
  {
    title: "原创",
    text: "原创小说、散文、随笔与独立世界观写作，题材不限，鼓励真诚而具体的表达。",
  },
  {
    title: "短篇连载",
    text: "适合连续刊载的短篇故事，单篇可独立阅读，也可作为系列的一部分。",
  },
  {
    title: "长篇连载",
    text: "篇幅较长、结构完整的连载作品，投稿时请附整体大纲与后续更新计划。",
  },
];

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const associations = await prisma.association.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="wrap py-14 lg:py-20">
      <header className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="eyebrow">About</p>
          <h1 className="mt-4 font-serif text-4xl leading-snug tracking-wide text-ink-900 sm:text-5xl">
            一株百合的
            <br />
            十年与数种可能
          </h1>
          <p className="mt-6 max-w-xl text-sm leading-8 text-ink-700/75">
            淮联百合同好会成立于 2016 年，是淮安大学历史最久的文学社团之一。
            2025 年，同好会创办《淮联百合期刊》，希望把零散的阅读、讨论与写作，
            整理为可以留存、可以被引用的文本。
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/submit" className="btn-primary">
              投稿
            </Link>
            <Link href="/membership" className="btn-outline">
              申请入会
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-2 rotate-2 border border-gold-400/30" />
          <div className="relative bg-paper-100 p-8">
            <p className="font-serif text-lg leading-9 text-ink-900/85">
              “我们并不试图代表某一种文学。
              <br />
              我们只是愿意为那些认真写下句子的人，
              <br />
              保留一张安静的书桌。”
            </p>
            <p className="mt-6 text-right text-[11px] tracking-[0.14em] text-ink-700/50">
              —— 创刊号卷首语
            </p>
          </div>
        </div>
      </header>

      <section className="mt-20 grid gap-10 border-t border-ink-900/10 pt-12 lg:grid-cols-[0.4fr_0.6fr]">
        <div>
          <p className="eyebrow">Mission</p>
          <h2 className="mt-3 font-serif text-2xl text-ink-900">办刊宗旨</h2>
        </div>
        <div className="space-y-5 text-sm leading-8 text-ink-700/80">
          <p>
            本刊坚持专业性与可读性并重。一方面，我们要求来稿遵守基本的写作规范，
            注明材料来源，尊重已有研究；另一方面，我们也拒绝把“专业”当作晦涩的借口，
            希望文章能够被非专业读者读懂。
          </p>
          <p>
            本刊实行三审制：编辑初审、同行外审、主编终审。所有审稿意见都会记录在系统中，
            作者可以随时查看进度。我们承诺在 30 日内给出初审结果。
          </p>
          <p>
            本刊不以任何形式收取版面费。刊物以纸质与数字双版发行，作者保留著作权，
            并授权本刊在数字平台非独占性使用。
          </p>
        </div>
      </section>

      <section className="mt-16">
        <p className="eyebrow">Sections</p>
        <h2 className="mt-3 font-serif text-2xl text-ink-900">栏目设置</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <div key={section.title} className="card p-5">
              <p className="font-serif text-base text-ink-900">{section.title}</p>
              <p className="mt-2 text-xs leading-6 text-ink-700/70">{section.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <p className="eyebrow">Editorial Board</p>
        <h2 className="mt-3 font-serif text-2xl text-ink-900">编委会</h2>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {board.map((member) => (
            <div
              key={member.name}
              className="flex items-center justify-between border-b border-ink-900/10 pb-3"
            >
              <div>
                <p className="font-serif text-[15px] text-ink-900">{member.name}</p>
                <p className="mt-0.5 text-[10px] text-ink-700/50">{member.affiliation}</p>
              </div>
              <Badge className="bg-ink-900/5 text-ink-700 ring-ink-900/10">
                {member.role}
              </Badge>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[11px] leading-6 text-ink-700/45">
          注：编委会名单为演示数据，正式上线前请替换为实际成员信息。
        </p>
      </section>

      <section className="mt-16">
        <p className="eyebrow">Associations</p>
        <h2 className="mt-3 font-serif text-2xl text-ink-900">关联协会与社团</h2>
        {associations.length === 0 ? (
          <p className="mt-4 text-xs text-ink-700/50">
            协会资料正在整理中。
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {associations.map((association) => (
              <article key={association.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-serif text-base text-ink-900">
                    {association.name}
                  </h3>
                  {association.shortName && (
                    <Badge className="bg-ink-900/5 text-ink-700 ring-ink-900/10">
                      {association.shortName}
                    </Badge>
                  )}
                </div>
                <p className="mt-3 text-xs leading-6 text-ink-700/70">
                  {association.description}
                </p>
                {(association.email || association.groupNumber) && (
                  <div className="mt-4 space-y-1 border-t border-ink-900/10 pt-3 text-[10px] text-ink-700/50">
                    {association.email && <p>邮箱：{association.email}</p>}
                    {association.groupNumber && (
                      <p>群号：{association.groupNumber}</p>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-16 grid gap-8 border-t border-ink-900/10 pt-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Guidelines</p>
          <h2 className="mt-3 font-serif text-2xl text-ink-900">投稿须知</h2>
          <ol className="mt-5 space-y-3 text-sm leading-7 text-ink-700/80">
            <li>1. 来稿须为原创，未在其他公开出版物或平台发表。</li>
            <li>2. 篇幅以 4000—12000 字为宜，附 30—800 字摘要与 3—5 个关键词。</li>
            <li>3. 引文请注明出处，注释采用页下注或文末注，格式统一即可。</li>
            <li>4. 本刊对稿件有编辑修改权，涉及实质内容的修改将与作者协商。</li>
            <li>5. 请勿一稿多投。投稿后 30 日内未收到通知，可自行处理。</li>
          </ol>
        </div>
        <div>
          <p className="eyebrow">Contact</p>
          <h2 className="mt-3 font-serif text-2xl text-ink-900">联系我们</h2>
          <div className="mt-5 space-y-2 text-sm leading-7 text-ink-700/80">
            <p>地址：江苏省淮安市 · 淮安大学淮联百合同好会编辑部</p>
            <p>邮箱：{SITE_CONTACT_EMAIL}</p>
            <p>同好会群：{SITE_GROUP_NUMBER}</p>
            <p>办公时间：每周三、周五 14:00—17:00</p>
            <p className="text-[11px] text-ink-700/45">
              ISSN 0000-0000（预留）· 本页信息为演示内容
            </p>
          </div>
          <Link href="/membership" className="mt-6 inline-flex text-sm text-crimson-600 no-underline">
            加入同好会 →
          </Link>
        </div>
      </section>
    </div>
  );
}
