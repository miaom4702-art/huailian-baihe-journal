import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "淮联百合学刊 · 淮安大学淮联百合同好会",
    template: "%s · 淮联百合学刊",
  },
  description:
    "《淮联百合学刊》由淮安大学淮联百合同好会主办，刊发文学研究、历史考据、文化观察与艺术评论，记录校园写作与地方记忆。",
  keywords: ["淮联百合学刊", "淮安大学", "淮联百合同好会", "校园文学", "地方文化"],
  authors: [{ name: "淮安大学淮联百合同好会" }],
  openGraph: {
    title: "淮联百合学刊",
    description: "淮安大学淮联百合同好会主办的人文期刊",
    type: "website",
    locale: "zh_CN",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
