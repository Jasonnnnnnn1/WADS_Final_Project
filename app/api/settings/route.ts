import { type NextRequest } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth-middleware";
import { err, ok } from "@/lib/api-response";
import { ensureAndGetUserSettings, updateUserSettings } from "@/lib/services/settings-service";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  const limited = enforceRateLimit(request, "settings-get", { windowMs: 60_000, max: 60 }, auth.userId);
  if (limited.limited) return err("Too many requests", 429);

  try {
    const settings = await ensureAndGetUserSettings(auth);
    return ok(settings);
  } catch (e) {
    return err("Failed to load settings", 500);
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  const limited = enforceRateLimit(request, "settings-put", { windowMs: 60_000, max: 20 }, auth.userId);
  if (limited.limited) return err("Too many requests", 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err("Invalid JSON body");
  }

  if (typeof body !== "object" || body === null) return err("Invalid payload");

  try {
    const updated = await updateUserSettings(auth, body as Record<string, unknown>);
    return ok(updated);
  } catch (e) {
    return err("Failed to update settings", 500);
  }
}
