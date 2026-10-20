"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ROLES, ROLE_LABELS, type Role } from "@/lib/constants";

type Props = {
  userId: string;
  currentRole: Role;
  disabled?: boolean;
};

export function RoleSelect({ userId, currentRole, disabled }: Props) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(currentRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(nextRole: string) {
    const next = nextRole as Role;
    if (next === role) return;
    if (!window.confirm(`确定将该用户的角色改为「${ROLE_LABELS[next]}」吗？`)) {
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(result.error ?? "修改失败");
        return;
      }
      setRole(next);
      router.refresh();
    } catch {
      setError("网络异常，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <select
        value={role}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || loading}
        className="rounded-sm border border-ink-900/20 bg-white px-2 py-1 text-[11px] text-ink-800 disabled:opacity-50"
      >
        {ROLES.map((item) => (
          <option key={item} value={item}>
            {ROLE_LABELS[item]}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-[10px] text-crimson-600">{error}</p>}
    </div>
  );
}
