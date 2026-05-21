import { prisma } from "@/lib/prisma";

export async function checkDueReminders() {
  // Simple developer tooling endpoint: fetch all user settings and identify
  // those with a dailyReminder enabled in notificationRules. For a real
  // scheduler you'd query reminders by schedule; this is intentionally simple.
  const all = await prisma.userSettings.findMany();
  const due: Array<{ userId: string; rules: any }> = [];

  for (const s of all) {
    try {
      const rules = s.notificationRules ?? {};
      if (rules?.dailyReminder === true || rules?.enabled === true) {
        due.push({ userId: s.userId, rules });
      }
    } catch (e) {
      // ignore parsing issues
    }
  }

  // For now, just return the list so the caller can log/inspect
  return { totalSettings: all.length, dueCount: due.length, due };
}
