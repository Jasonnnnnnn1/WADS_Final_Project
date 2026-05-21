"use client";

import * as React from "react";
import { addDays, addMinutes, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, CalendarClock, Clock3, Loader2, RefreshCw, Sparkles, AlertTriangle } from "lucide-react";
import { aiApi, tasksApi, type Task } from "@/lib/api-client";
import { saveCachedAiPlan, saveCachedAiPlanView } from "@/lib/ai-plan-cache";
import { loadAISettings, type AISettings } from "@/lib/ai-preferences";

type OptimizedTask = {
  task: Task;
  suggestedStart: Date | null;
  suggestedEnd: Date | null;
  rank: number;
  reason: string;
};

export default function AiPlanPage() {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiPlan, setAiPlan] = React.useState<OptimizedTask[]>([]);
  const [aiSettings, setAiSettings] = React.useState<AISettings>(() => loadAISettings());
  const [recommendations, setRecommendations] = React.useState<string[]>([]);
  const [burnoutRisk, setBurnoutRisk] = React.useState<{ riskLevel: "low" | "medium" | "high"; workload: number; suggestedBreakTime: number; recommendations: string[] } | null>(null);

  const loadTasks = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await tasksApi.list();
      setTasks(data);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  React.useEffect(() => {
    const syncSettings = () => setAiSettings(loadAISettings());
    window.addEventListener("ai-settings-updated", syncSettings as EventListener);
    window.addEventListener("storage", syncSettings);

    return () => {
      window.removeEventListener("ai-settings-updated", syncSettings as EventListener);
      window.removeEventListener("storage", syncSettings);
    };
  }, []);

  const optimized = React.useMemo(
    () =>
      buildOptimizedTaskList(tasks, new Date(), {
        startHour: aiSettings.workStartHour,
        endHour: aiSettings.workEndHour,
        allowWeekends: aiSettings.allowWeekendScheduling,
      }),
    [tasks, aiSettings]
  );

  async function handleGenerateGroqPlan() {
    setAiLoading(true);
    try {
      const prioritizePreferences = {
        preferredHours: { start: aiSettings.workStartHour, end: aiSettings.workEndHour },
        allowWeekends: aiSettings.allowWeekendScheduling,
      };

      const prioritized = await aiApi.prioritize(prioritizePreferences);

      saveCachedAiPlan(prioritized.recommendations);

      const mappedPlan = prioritized.recommendations
        .map((item, index) => {
          const task = tasks.find((taskItem) => taskItem.id === item.taskId);
          if (!task) return null;
          if (isTaskCompleted(task.status)) return null;
          const dateAnchor = item.suggestedDate ? new Date(item.suggestedDate) : new Date();
          const start = parseSuggestedTime(item.suggestedTime, dateAnchor);
          const end = addMinutes(start, item.duration);
          return {
            task,
            suggestedStart: start,
            suggestedEnd: end,
            rank: index + 1,
            reason: item.reasoning,
          } satisfies OptimizedTask;
        })
        .filter(Boolean) as OptimizedTask[];

      const finalPlan = mappedPlan.length > 0
        ? mappedPlan
        : buildOptimizedTaskList(tasks, new Date(), {
            startHour: aiSettings.workStartHour,
            endHour: aiSettings.workEndHour,
            allowWeekends: aiSettings.allowWeekendScheduling,
          });

      saveCachedAiPlanView(
        finalPlan
          .filter((item) => item.suggestedStart && item.suggestedEnd)
          .map((item) => ({
            taskId: item.task.id,
            rank: item.rank,
            reason: item.reason,
            suggestedStartIso: item.suggestedStart!.toISOString(),
            suggestedEndIso: item.suggestedEnd!.toISOString(),
          }))
      );

      setAiPlan(finalPlan);

      void Promise.allSettled([aiApi.recommendations(), aiApi.burnout()]).then(([recsResult, burnoutResult]) => {
        if (recsResult.status === "fulfilled") {
          setRecommendations(recsResult.value.recommendations);
        }
        if (burnoutResult.status === "fulfilled") {
          setBurnoutRisk(burnoutResult.value.analysis);
        }
      });
    } catch {
      const fallbackPlan = buildOptimizedTaskList(tasks, new Date(), {
        startHour: aiSettings.workStartHour,
        endHour: aiSettings.workEndHour,
        allowWeekends: aiSettings.allowWeekendScheduling,
      });

      setAiPlan(fallbackPlan);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <main className="flex-1 bg-muted/5 overflow-y-auto w-full">
      <header className="px-8 py-8 border-b bg-background flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-indigo-600" />
            AI Optimized Plan
          </h1>
          <p className="text-muted-foreground mt-1">
            A prioritized queue of your tasks with recommended execution times.
          </p>
        </div>
        <Button variant="outline" onClick={loadTasks}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh Plan
        </Button>
      </header>

      <div className="p-8 max-w-5xl mx-auto w-full space-y-6">
        <Card className="border-indigo-200 bg-indigo-50/60 dark:border-indigo-800 dark:bg-indigo-950/40">
          <CardHeader>
            <CardTitle className="text-base text-indigo-900 dark:text-indigo-300">How to read this</CardTitle>
            <CardDescription className="text-indigo-700 dark:text-indigo-200">
              Start from rank #1 and follow down the list. Each item includes a suggested start/end time and why it was positioned there.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border border-muted shadow-sm">
          <CardContent className="py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" /> AI-powered planning
              </p>
              <p className="text-sm text-muted-foreground">
                Generate AI priorities, smart recommendations, and burnout checks from your live task list.
              </p>
            </div>
            <Button onClick={handleGenerateGroqPlan} disabled={aiLoading || tasks.length === 0}>
              {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate AI Plan
            </Button>
          </CardContent>
        </Card>

        {(recommendations.length > 0 || burnoutRisk) && (
          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Smart Recommendations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {recommendations.map((item) => (
                    <p key={item} className="rounded-md border bg-muted/30 px-3 py-2">{item}</p>
                  ))}
                </CardContent>
              </Card>
            )}

            {burnoutRisk && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" /> Burnout Check
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>Risk level: <span className="font-semibold">{burnoutRisk.riskLevel}</span></p>
                  <p>Workload score: <span className="font-semibold">{Math.round(burnoutRisk.workload)}%</span></p>
                  <p>Suggested break: <span className="font-semibold">{burnoutRisk.suggestedBreakTime} min</span></p>
                  {burnoutRisk.recommendations.map((item) => (
                    <p key={item} className="rounded-md border bg-muted/30 px-3 py-2">{item}</p>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : optimized.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No tasks found yet. Add tasks first, then AI Plan will optimize them.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {(aiPlan.length > 0 ? aiPlan : optimized).map((item) => (
              <Card key={`${item.task.id}-${item.rank}`} className="shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">Rank #{item.rank}</Badge>
                        <Badge variant={item.task.priority === "urgent" ? "destructive" : item.task.priority === "high" ? "default" : "secondary"}>
                          {item.task.priority}
                        </Badge>
                        <Badge variant="outline">{item.task.status}</Badge>
                      </div>
                      <h2 className="text-lg font-semibold text-foreground">{item.task.title}</h2>
                      {(item.task.course || item.task.category) && (
                        <p className="text-sm text-muted-foreground">{[item.task.course, item.task.category].filter(Boolean).join(" • ")}</p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Due: {format(new Date(item.task.endTime), "EEE, MMM d • h:mm a")}
                    </div>
                  </div>

                  <div className="mt-4 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    {item.suggestedStart && item.suggestedEnd ? (
                      <>
                        <p className="font-medium text-foreground flex items-center gap-2">
                          <CalendarClock className="h-4 w-4" />
                          Suggested: {format(item.suggestedStart, "EEE, MMM d • h:mm a")} - {format(item.suggestedEnd, "h:mm a")}
                        </p>
                        <p className="mt-1 text-muted-foreground">{item.reason}</p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">No AI schedule suggestion was generated for this task.</p>
                    )}
                  </div>

                  {item.task.description && (
                    <div className="mt-3 text-sm text-muted-foreground flex items-start gap-2">
                      <Clock3 className="h-4 w-4 mt-0.5" />
                      <span>{item.task.description}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function buildOptimizedTaskList(
  tasks: Task[],
  anchorDate: Date,
  preferences: { startHour: number; endHour: number; allowWeekends: boolean }
): OptimizedTask[] {
  const selectedDayStart = startOfDaySafe(anchorDate);
  const todayStart = startOfDaySafe(new Date());
  const planningStart = moveToNextWorkday(
    selectedDayStart > todayStart ? selectedDayStart : todayStart,
    preferences.allowWeekends
  );
  const perDayCounts = new Map<string, number>();

  const pending = tasks
    .filter((task) => !isTaskCompleted(task.status))
    .sort((a, b) => {
      const priorityDiff = getPriorityScore(b.priority) - getPriorityScore(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
    });

  const optimized: OptimizedTask[] = [];
  let cursorDay = new Date(planningStart);
  let rank = 1;

  for (const task of pending) {
    const durationMinutes = getTaskDurationMinutes(task);
    const maxPerDay = getDailyTaskCap(task.priority);
    let plannedDay = moveToNextWorkday(new Date(cursorDay), preferences.allowWeekends);

    while (true) {
      plannedDay = moveToNextWorkday(plannedDay, preferences.allowWeekends);
      const key = plannedDay.toISOString().slice(0, 10);
      const count = perDayCounts.get(key) ?? 0;
      if (count < maxPerDay) {
        perDayCounts.set(key, count + 1);
        const suggestedStart = alignToQuarterHour(
          setDayTime(plannedDay, getSuggestedHour(task.priority, count, preferences.startHour, preferences.endHour), 0)
        );
        const suggestedEnd = addMinutes(suggestedStart, durationMinutes);

        optimized.push({
          task,
          suggestedStart,
          suggestedEnd,
          rank,
          reason: `Prioritized as ${task.priority}; due ${format(new Date(task.endTime), "EEE, MMM d h:mm a")}.`,
        });

        cursorDay = new Date(plannedDay);
        rank += 1;
        break;
      }

      plannedDay = addDays(plannedDay, 1);
    }
  }

  return optimized;
}

function isTaskCompleted(status: string) {
  return status.trim().toLowerCase() === "completed";
}

function getTaskDurationMinutes(task: Task): number {
  const start = new Date(task.startTime).getTime();
  const end = new Date(task.endTime).getTime();
  const raw = Math.round((end - start) / 60000);
  return Math.min(180, Math.max(30, raw));
}

function getPriorityScore(priority: Task["priority"]) {
  if (priority === "urgent") return 4;
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  return 1;
}

function alignToQuarterHour(date: Date) {
  const copy = new Date(date);
  const minutes = copy.getMinutes();
  const remainder = minutes % 15;
  if (remainder !== 0) {
    copy.setMinutes(minutes + (15 - remainder), 0, 0);
  }
  return copy;
}

function setDayTime(date: Date, hours: number, minutes: number) {
  const copy = new Date(date);
  copy.setHours(hours, minutes, 0, 0);
  return copy;
}

function getDailyTaskCap(priority: Task["priority"]) {
  if (priority === "urgent" || priority === "high") return 1;
  if (priority === "medium") return 2;
  return 4;
}

function getSuggestedHour(priority: Task["priority"], slotIndex: number, startHour: number, endHour: number) {
  const boundedEnd = Math.max(startHour + 2, endHour);
  if (priority === "urgent") return startHour;
  if (priority === "high") return Math.min(startHour + 2, boundedEnd - 1);
  if (priority === "medium") return slotIndex === 0 ? Math.min(startHour + 4, boundedEnd - 1) : Math.min(startHour + 6, boundedEnd - 1);
  return Math.min(startHour + 1 + slotIndex * 2, boundedEnd - 1);
}

function moveToNextWorkday(date: Date, allowWeekends: boolean) {
  const copy = startOfDaySafe(date);
  if (allowWeekends) {
    return copy;
  }
  while (isWeekend(copy)) {
    copy.setDate(copy.getDate() + 1);
  }
  return copy;
}

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function startOfDaySafe(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function parseSuggestedTime(value: string, anchorDate: Date) {
  const [hoursString, minutesString] = value.split(":");
  const hours = Number(hoursString);
  const minutes = Number(minutesString);
  const next = new Date(anchorDate);
  next.setHours(Number.isFinite(hours) ? hours : 9, Number.isFinite(minutes) ? minutes : 0, 0, 0);
  return next;
}
