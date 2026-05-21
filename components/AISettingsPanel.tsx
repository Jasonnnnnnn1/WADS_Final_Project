"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DEFAULT_AI_SETTINGS, loadAISettings, saveAISettings, type AISettings } from "@/lib/ai-preferences";
import { settingsApi } from "@/lib/api-client";
import { Sparkles, RotateCcw, Save } from "lucide-react";

export default function AISettingsPanel() {
  const [settings, setSettings] = useState<AISettings>(loadAISettings);
  const [savedMessage, setSavedMessage] = useState("");
  const [isLocalOnly, setIsLocalOnly] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await settingsApi.get();
        if (!mounted) return;
        if (res?.aiPreferences) {
          setSettings((prev) => ({ ...prev, ...res.aiPreferences }));
          setIsLocalOnly(false);
        }
      } catch {
        // keep local defaults
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    try {
      await settingsApi.update({ aiPreferences: settings });
      setSavedMessage("AI preferences saved.");
      setIsLocalOnly(false);
      window.setTimeout(() => setSavedMessage(""), 2500);
    } catch {
      // fallback to local storage
      // (keep existing local behavior for offline/dev)
      try {
        // persist via the local helper to keep normalization consistent
        saveAISettings(settings);
        setSavedMessage("AI preferences saved locally.");
        window.setTimeout(() => setSavedMessage(""), 2500);
      } catch {
        setSavedMessage("Failed to save AI preferences.");
        window.setTimeout(() => setSavedMessage(""), 2500);
      }
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_AI_SETTINGS);
    saveAISettings(DEFAULT_AI_SETTINGS);
    setSavedMessage("AI preferences reset to defaults.");
    window.setTimeout(() => setSavedMessage(""), 2500);
  };

  return (
    <Card className="border-muted shadow-sm">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" /> AI Preferences
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Tune Jessalyne's tone, response length, and study style for this browser session.
            </p>
          </div>
            {!isLocalOnly ? null : <Badge variant="outline">Local only</Badge>}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Prompt style</Label>
            <Select value={settings.promptStyle} onValueChange={(value) => setSettings((prev) => ({ ...prev, promptStyle: value as AISettings["promptStyle"] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supportive">Supportive</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Max response length</Label>
            <Select value={settings.maxResponseLength} onValueChange={(value) => setSettings((prev) => ({ ...prev, maxResponseLength: value as AISettings["maxResponseLength"] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a length" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="long">Long</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Study mode</Label>
            <Select value={settings.studyMode} onValueChange={(value) => setSettings((prev) => ({ ...prev, studyMode: value as AISettings["studyMode"] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="focus">Focus</SelectItem>
                <SelectItem value="exam">Exam prep</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="focus-block">Focus block (min)</Label>
              <Input
                id="focus-block"
                type="number"
                min={15}
                max={90}
                value={settings.focusBlockMinutes}
                onChange={(event) => setSettings((prev) => ({ ...prev, focusBlockMinutes: Number(event.target.value) || 25 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="break-minutes">Break (min)</Label>
              <Input
                id="break-minutes"
                type="number"
                min={3}
                max={30}
                value={settings.breakMinutes}
                onChange={(event) => setSettings((prev) => ({ ...prev, breakMinutes: Number(event.target.value) || 5 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="work-start-hour">Work start hour</Label>
              <Input
                id="work-start-hour"
                type="number"
                min={6}
                max={14}
                value={settings.workStartHour}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    workStartHour: Number(event.target.value) || DEFAULT_AI_SETTINGS.workStartHour,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="work-end-hour">Work end hour</Label>
              <Input
                id="work-end-hour"
                type="number"
                min={12}
                max={23}
                value={settings.workEndHour}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    workEndHour: Number(event.target.value) || DEFAULT_AI_SETTINGS.workEndHour,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between rounded-md border bg-muted/20 px-3 py-2">
              <div>
                <Label htmlFor="allow-weekend-scheduling" className="text-sm">Allow weekend scheduling</Label>
                <p className="text-xs text-muted-foreground">Turn off to keep AI plans on school/work weekdays only.</p>
              </div>
              <Switch
                id="allow-weekend-scheduling"
                checked={settings.allowWeekendScheduling}
                onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, allowWeekendScheduling: checked }))}
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
          <p>Prompt style changes the tone Jessalyne uses in chat and task help.</p>
          <p>Max response length controls how verbose the assistant should be.</p>
          <p>Study mode shifts the assistant toward balanced planning, deep focus, or exam prep.</p>
          <p>Work hours and weekend setting guide when AI schedules your tasks.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground min-h-5">{savedMessage}</div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
            <Button type="button" onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
              <Save className="mr-2 h-4 w-4" /> Save AI Preferences
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
