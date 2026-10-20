import "server-only";

import { getCurrentUser, type SessionUser } from "./auth";
import { ROLE_RANK, type Role } from "./constants";
import { HttpError } from "./security";

export async function requireApiUser(minRole: Role = "READER"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new HttpError(401, "登录状态已失效，请重新登录");
  }
  if (ROLE_RANK[user.role] < ROLE_RANK[minRole]) {
    throw new HttpError(403, "当前账号权限不足");
  }
  return user;
}
