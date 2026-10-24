import type { Metadata } from "next";

import { MembershipForm } from "@/components/membership-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "申请入会",
  description: "申请加入淮安大学淮联百合同好会，参与读书会、写作工坊与《淮联百合期刊》的编辑工作。",
};

export const dynamic = "force-dynamic";

export default async function MembershipPage() {
  const user = await getCurrentUser();

  return (
    <div className="wrap py-14 lg:py-20">
      <header className="max-w-2xl">
        <p className="eyebrow">Membership</p>
        <h1 className="mt-3 font-serif text-4xl tracking-wide text-ink-900">申请入会</h1>
        <p className="mt-4 text-sm leading-8 text-ink-700/75">
          同好会面向淮安大学全体师生，也欢迎校外同道以通讯会员身份参与。
          我们更看重持续的参与，而不是一份漂亮的履历。
        </p>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <MembershipForm
            defaultName={user?.name}
            defaultEmail={user?.email}
          />
          <p className="mt-3 text-[11px] leading-6 text-ink-700/45">
            提交申请即表示你同意编辑部为审核目的保存上述信息。我们不会将信息用于其他用途。
          </p>
        </div>

        <aside className="space-y-6">
          <div className="card p-6">
            <p className="eyebrow">What we do</p>
            <h2 className="mt-2 font-serif text-xl text-ink-900">会员可以参与</h2>
            <ul className="mt-4 space-y-3 text-[13px] leading-6 text-ink-700/75">
              <li>· 每月一次的共读与写作工坊</li>
              <li>· 期刊的组稿、审稿与校对工作</li>
              <li>· 地方文献的田野调查与口述史采集</li>
              <li>· “百合杯”校园文学奖的评审与活动筹备</li>
              <li>· 与校外书店、出版社的联合活动</li>
            </ul>
          </div>

          <div className="card p-6">
            <p className="eyebrow">Process</p>
            <h2 className="mt-2 font-serif text-xl text-ink-900">审核流程</h2>
            <ol className="mt-4 space-y-4">
              {[
                ["01", "提交申请", "填写基本信息与申请理由。"],
                ["02", "理事会审核", "两周内完成，必要时会安排一次面谈。"],
                ["03", "邮件通知", "审核结果发送至所填邮箱。"],
                ["04", "加入社群", "进入会员群，参与下一次活动。"],
              ].map(([step, title, text]) => (
                <li key={step} className="flex gap-3">
                  <span className="font-serif text-sm text-crimson-600">{step}</span>
                  <div>
                    <p className="text-[13px] font-medium text-ink-900">{title}</p>
                    <p className="mt-0.5 text-[11px] leading-5 text-ink-700/60">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="border border-ink-900/10 bg-paper-100/60 p-5 text-[11px] leading-6 text-ink-700/60">
            同好会不收取会费。刊物印刷与活动经费来自学校社团专项支持及自愿捐赠。
          </div>
        </aside>
      </div>
    </div>
  );
}
