import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="font-serif text-6xl text-ink-900/15">404</span>
      <h1 className="mt-6 font-serif text-2xl text-ink-900">这一页还没有被写下</h1>
      <p className="mt-3 max-w-md text-sm leading-7 text-ink-700/65">
        你访问的页面不存在，或已经被移到别处。可以回到首页，或去文章列表里继续阅读。
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-primary">
          返回首页
        </Link>
        <Link href="/articles" className="btn-outline">
          浏览文章
        </Link>
      </div>
    </div>
  );
}
