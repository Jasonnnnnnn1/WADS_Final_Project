"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { settingsApi } from "@/lib/api-client";

export default function NotificationsSettings() {
  const { setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [config, setConfig] = useState<any>({
    notificationRules: { enabled: false, dailyReminder: false, reminderTime: "09:00", channels: ["in-app"] },
    calendarPreferences: { defaultView: "week", weekStart: 1 },
    focusTimerDefaults: { focus: 25, shortBreak: 5, longBreak: 15 },
    privacyControls: { allowDataExport: false, dataRetentionDays: 365 },
    appearanceSettings: { theme: "system", density: "comfortable", reducedMotion: false },
  });

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await settingsApi.get();
        if (!mounted) return;
        if (res) {
          setConfig((prev:any) => ({ ...prev, ...res }));
          const theme = res?.appearanceSettings?.theme;
          if (theme) {
            setTheme(theme);
          }
        }
      } catch (e) {
        setError("Failed to load settings");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  const save = async () => {
    setError("");
    setSaving(true);
    try {
      await settingsApi.update(config);
    } catch {
      setError("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-8 text-sm text-muted-foreground">Loading settings...</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Notifications</h3>
          <div className="mt-3">
            <Label>Enable Notifications</Label>
            <div className="mt-2">
              <Switch checked={!!config.notificationRules?.enabled} onCheckedChange={(v) => setConfig((c:any)=> ({ ...c, notificationRules: { ...c.notificationRules, enabled: v } }))} />
            </div>
            <div className="mt-3">
              <Label>Daily Reminder</Label>
              <div className="flex gap-2 mt-2 items-center">
                <Switch checked={!!config.notificationRules?.dailyReminder} onCheckedChange={(v) => setConfig((c:any)=> ({ ...c, notificationRules: { ...c.notificationRules, dailyReminder: v } }))} />
                <Input value={config.notificationRules?.reminderTime ?? "09:00"} onChange={(e)=> setConfig((c:any)=> ({ ...c, notificationRules: { ...c.notificationRules, reminderTime: e.target.value } }))} type="time" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Calendar</h3>
          <div className="mt-3">
            <Label>Default View</Label>
            <select className="mt-2 w-full" value={config.calendarPreferences?.defaultView} onChange={(e)=> setConfig((c:any)=> ({ ...c, calendarPreferences: { ...c.calendarPreferences, defaultView: e.target.value } }))}>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
            <div className="mt-3">
              <Label>Week Start</Label>
              <select className="mt-2 w-full" value={config.calendarPreferences?.weekStart} onChange={(e)=> setConfig((c:any)=> ({ ...c, calendarPreferences: { ...c.calendarPreferences, weekStart: Number(e.target.value) } }))}>
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Focus Timer Defaults</h3>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Input value={config.focusTimerDefaults?.focus} onChange={(e)=> setConfig((c:any)=> ({ ...c, focusTimerDefaults: { ...c.focusTimerDefaults, focus: Number(e.target.value) } }))} />
            <Input value={config.focusTimerDefaults?.shortBreak} onChange={(e)=> setConfig((c:any)=> ({ ...c, focusTimerDefaults: { ...c.focusTimerDefaults, shortBreak: Number(e.target.value) } }))} />
            <Input value={config.focusTimerDefaults?.longBreak} onChange={(e)=> setConfig((c:any)=> ({ ...c, focusTimerDefaults: { ...c.focusTimerDefaults, longBreak: Number(e.target.value) } }))} />
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Privacy</h3>
          <div className="mt-3">
            <Label>Allow Data Export</Label>
            <div className="mt-2"><Switch checked={!!config.privacyControls?.allowDataExport} onCheckedChange={(v)=> setConfig((c:any)=> ({ ...c, privacyControls: { ...c.privacyControls, allowDataExport: v } }))} /></div>
            <div className="mt-3">
              <Label>Data Retention (days)</Label>
              <Input value={config.privacyControls?.dataRetentionDays} onChange={(e)=> setConfig((c:any)=> ({ ...c, privacyControls: { ...c.privacyControls, dataRetentionDays: Number(e.target.value) } }))} />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="font-semibold">Appearance</h3>
          <div className="mt-3">
            <Label>Theme</Label>
            <select
              className="mt-2 w-full"
              value={config.appearanceSettings?.theme}
              onChange={(e) => {
                const theme = e.target.value;
                setTheme(theme);
                setConfig((c:any)=> ({ ...c, appearanceSettings: { ...c.appearanceSettings, theme } }));
              }}
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <div className="mt-3"><Label>Reduced Motion</Label><div className="mt-2"><Switch checked={!!config.appearanceSettings?.reducedMotion} onCheckedChange={(v)=> setConfig((c:any)=> ({ ...c, appearanceSettings: { ...c.appearanceSettings, reducedMotion: v } }))} /></div></div>
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</Button>
      </div>
    </div>
  );
}
