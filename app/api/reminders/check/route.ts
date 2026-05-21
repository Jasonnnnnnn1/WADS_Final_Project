import { NextResponse } from "next/server";
import { checkDueReminders } from "@/lib/services/reminder-service";

export async function GET() {
  try {
    const res = await checkDueReminders();
    // Log for dev visibility
    console.log("reminders.check: found", res.dueCount, "due reminders");
    return NextResponse.json({ ok: true, result: res });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
