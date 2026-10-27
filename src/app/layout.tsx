import type { Metadata, Viewport } from "next";

import { AiAssistant } from "@/components/ai-assistant";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";

import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f7fbfd",
};

export const metadata: Metadata = {
  title: {
    default: "淮联百合期刊 · 淮安大学淮联百合同好会",
    template: "%s · 淮联百合期刊",
  },
  description:
    "《淮联百合期刊》由淮安大学淮联百合同好会主办，刊发同人、原创、短篇连载与长篇连载，记录校园写作与地方记忆。",
  keywords: ["淮联百合期刊", "淮安大学", "淮联百合同好会", "校园文学", "地方文化"],
  authors: [{ name: "淮安大学淮联百合同好会" }],
  openGraph: {
    title: "淮联百合期刊",
    description: "淮安大学淮联百合同好会主办的人文期刊",
    type: "website",
    locale: "zh_CN",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <MobileTabBar
          isLoggedIn={Boolean(user)}
          avatarImage={user?.avatarImage ?? null}
        />
        <AiAssistant />
      </body>
    </html>
  );
}
