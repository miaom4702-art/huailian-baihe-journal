import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink-900/10 bg-ink-950 text-paper-100/80">
      <div className="wrap grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/50 font-serif text-lg text-gold-300">
              百
            </span>
            <div>
              <p className="font-serif text-lg tracking-wider text-paper-50">
                淮联百合学刊
              </p>
              <p className="text-[9px] uppercase tracking-[0.22em] text-paper-100/40">
                Journal of Huailian Baihe
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-xs leading-7 text-paper-100/60">
            由淮安大学淮联百合同好会主办的人文期刊，关注校园写作、地方记忆与青年共同体。
            刊物以季刊形式出版，并同步发布数字版。
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-300/80">
            导航
          </p>
          <ul className="mt-4 space-y-2.5 text-xs">
            {[
              ["/articles", "文章浏览"],
              ["/issues", "往期期刊"],
              ["/announcements", "公告动态"],
              ["/about", "关于我们"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-paper-100/60 no-underline transition-colors hover:text-paper-50"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-300/80">
            联系
          </p>
          <ul className="mt-4 space-y-2.5 text-xs text-paper-100/60">
            <li>江苏省淮安市 · 淮安大学</li>
            <li>淮联百合同好会编辑部</li>
            <li>editor@hlbh.org</li>
            <li>ISSN 0000-0000（预留）</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-paper-50/10">
        <div className="wrap flex flex-col gap-2 py-5 text-[10px] text-paper-100/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} 淮安大学淮联百合同好会 · 保留所有权利</p>
          <p>本刊文字版权归作者所有，未经许可不得转载</p>
        </div>
      </div>
    </footer>
  );
}
