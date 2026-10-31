import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

import { AiAssistant } from "@/components/ai-assistant";
import { AppearanceProvider } from "@/components/appearance-provider";
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
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const themeBootstrap = `(function(){try{var m=localStorage.getItem("hlbh-theme");if(!m){var n=new Date();m=n.getMonth()===9&&n.getDate()===31?"halloween":"light";}var h=m==="halloween";var d=h||m==="dark"||(m==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.classList.toggle("halloween",h);document.documentElement.dataset.theme=h?"halloween":d?"dark":"light";if(window.HLBHTheme&&window.HLBHTheme.setTheme){window.HLBHTheme.setTheme(h?"halloween":d?"dark":"light");}}catch(e){}})();`;

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <AppearanceProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <MobileTabBar
            isLoggedIn={Boolean(user)}
            avatarImage={user?.avatarImage ?? null}
          />
          <AiAssistant />
        </AppearanceProvider>
      </body>
    </html>
  );
}
