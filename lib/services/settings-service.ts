import { getSettingsByUserId, upsertSettingsByUserId } from "@/lib/repositories/settings-repository";
import type { AuthResult } from "@/lib/auth-middleware";

export async function ensureAndGetUserSettings(auth: AuthResult) {
  // upsert to ensure a row exists
  const existing = await getSettingsByUserId(auth.userId);
  if (existing) return existing;

  const created = await upsertSettingsByUserId(auth.userId, {});
  return created;
}

export async function updateUserSettings(auth: AuthResult, payload: Record<string, unknown>) {
  return upsertSettingsByUserId(auth.userId, payload);
}
