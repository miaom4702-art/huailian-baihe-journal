import "server-only";

import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { isRole, ROLE_RANK, type Role } from "./constants";
import { prisma } from "./db";

const SESSION_COOKIE = process.env.SESSION_COOKIE || "hlbh_session";
const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS || 72);

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  affiliation: string | null;
  bio: string | null;
  avatarImage: string | null;
  memberSince: Date | null;
  createdAt: Date;
};

type SessionMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export async function createSession(userId: string, meta: SessionMeta = {}) {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  await prisma.session.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      ip: meta.ip?.slice(0, 90) ?? null,
      userAgent: meta.userAgent?.slice(0, 255) ?? null,
    },
  });

  const store = await cookies();
  store.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return { token, expiresAt };
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => undefined);
  }

  store.delete(SESSION_COOKIE);
}

const sessionUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  affiliation: true,
  bio: true,
  avatarImage: true,
  memberSince: true,
  createdAt: true,
} as const;

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token || token.length < 20) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: sessionUserSelect } },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session
      .delete({ where: { id: session.id } })
      .catch(() => undefined);
    return null;
  }

  return {
    ...session.user,
    role: isRole(session.user.role) ? session.user.role : "READER",
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(minRole: Role): Promise<SessionUser> {
  const user = await requireUser();
  if (ROLE_RANK[user.role] < ROLE_RANK[minRole]) {
    redirect("/dashboard?error=forbidden");
  }
  return user;
}

export function hasRole(user: SessionUser | null, minRole: Role) {
  if (!user) return false;
  return ROLE_RANK[user.role] >= ROLE_RANK[minRole];
}
