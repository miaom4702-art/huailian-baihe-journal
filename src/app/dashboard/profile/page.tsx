import { ProfileForm } from "@/components/profile-form";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <div>
      <header>
        <p className="eyebrow">Profile</p>
        <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-ink-900">个人资料</h2>
        <p className="mt-2 text-sm text-ink-700/65">
          修改头像、昵称、院系与个人简介。邮箱用于登录，暂不支持自行修改。
        </p>
      </header>

      <div className="mt-8">
        <ProfileForm
          name={user.name}
          email={user.email}
          affiliation={user.affiliation}
          bio={user.bio}
          avatarImage={user.avatarImage}
          memberSince={user.memberSince?.toISOString() ?? null}
        />
      </div>
    </div>
  );
}
