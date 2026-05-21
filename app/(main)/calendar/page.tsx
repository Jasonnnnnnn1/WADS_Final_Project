"use client";

import * as React from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  Settings,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";
import { profileApi, tasksApi, type Task } from "@/lib/api-client";
import { useUserSettings } from "@/lib/user-settings";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

type CalendarView = "week" | "month";

export default function CalendarPage() {
  const router = useRouter();
  const { settings } = useUserSettings();
  const defaultView = settings?.calendarPreferences?.defaultView ?? "week";
  const defaultWeekStart = settings?.calendarPreferences?.weekStartsOn ?? 1;
  const [view, setView] = React.useState<CalendarView>(defaultView as CalendarView);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [profilePhotoUrl, setProfilePhotoUrl] = React.useState<string | null>(null);
  const [profileInitials, setProfileInitials] = React.useState("AL");

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setProfileInitials(getInitials(user?.displayName, user?.email));

      if (!user) {
        setProfilePhotoUrl(null);
        return;
      }

      try {
        const profile = await profileApi.get();
        setProfilePhotoUrl(profile.profilePhotoUrl ?? user.photoURL ?? null);
      } catch {
        setProfilePhotoUrl(user.photoURL ?? null);
      }
    });
    return unsubscribe;
  }, []);

  const sortedTasks = React.useMemo(
    () => [...tasks].sort((left, right) => new Date(left.startTime).getTime() - new Date(right.startTime).getTime()),
    [tasks]
  );

  const visibleTasks = sortedTasks;

  const weekStart = startOfWeek(currentDate, { weekStartsOn: defaultWeekStart });
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  const monthSections = React.useMemo(() => {
    const baseMonth = startOfMonth(currentDate);
    return Array.from({ length: 1 }, (_, offset) => {
      const monthDate = addMonths(baseMonth, offset);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthGridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const monthGridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
      const days: Date[] = [];

      for (let day = monthGridStart; day <= monthGridEnd; day = addDays(day, 1)) {
        days.push(day);
      }

      return { monthDate, days };
    });
  }, [currentDate]);

  const dayTasks = visibleTasks.filter((task) => {
    const d = startOfDaySafe(currentDate);
    return d >= startOfDaySafe(new Date(task.startTime)) && d <= startOfDaySafe(new Date(task.endTime));
  });
  const urgentTasks = visibleTasks.filter((task) => task.priority === "urgent" && new Date(task.startTime) >= startOfDaySafe(new Date()));

  function handlePrevious() {
    setCurrentDate((value) => {
      if (view === "week") return subWeeks(value, 1);
      return subMonths(value, 1);
    });
  }

  function handleNext() {
    setCurrentDate((value) => {
      if (view === "week") return addWeeks(value, 1);
      return addMonths(value, 1);
    });
  }

  function handleToday() {
    setCurrentDate(new Date());
  }

  const renderWeekDetails = () => (
    <div className="flex-1 min-h-0 flex flex-col overflow-y-auto bg-background p-4 sm:p-6">
      <div className="mb-6 rounded-lg border bg-muted/20 p-2 sm:p-3">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((day) => {
            const dayTasksList = visibleTasks.filter((task) => {
              const d = startOfDaySafe(day);
              return d >= startOfDaySafe(new Date(task.startTime)) && d <= startOfDaySafe(new Date(task.endTime));
            });
            const hasUrgent = dayTasksList.some(t => t.priority === "urgent");
            const hasTasks = dayTasksList.length > 0;
            const dotColor = isSameDay(day, currentDate) 
              ? "bg-primary-foreground" 
              : hasUrgent ? "bg-red-500" : "bg-primary";

            return (
              <button
                type="button"
                key={day.toISOString()}
                onClick={() => setCurrentDate(day)}
                className={`rounded-md border py-1.5 px-1 sm:px-2 flex flex-col items-center justify-center min-h-[52px] transition-colors ${
                  isSameDay(day, currentDate)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background hover:bg-muted"
                }`}
              >
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide shrink-0">
                  <span className="hidden sm:inline">{format(day, "EEE")}</span>
                  <span className="sm:hidden">{format(day, "EEEEE")}</span>
                </p>
                <p className="text-xs sm:text-sm font-bold mt-1 leading-none shrink-0">{format(day, "d")}</p>
                {hasTasks ? (
                  <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                ) : (
                  <div className="mt-1 w-1.5 h-1.5 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <h3 className="text-2xl font-bold mb-6 text-foreground">{format(currentDate, "EEEE, MMM d")}</h3>
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : dayTasks.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          No tasks due on this day.
        </div>
      ) : (
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-12 before:-translate-x-px before:h-full before:w-0.5 before:bg-border">
          {dayTasks.map((task) => {
            const startDate = new Date(task.startTime);
            const endDate = new Date(task.endTime);
            return (
              <div key={task.id} className="relative flex items-start gap-6 group">
                <div className="w-16 text-right pt-1">
                  <span className="text-xs font-bold text-muted-foreground">{format(startDate, "h:mm a")}</span>
                </div>
                <div className={`w-3 h-3 mt-1.5 rounded-full border-2 bg-background z-10 ${getDayDotStyles(task.priority)}`} />
                <div className={`flex-1 p-4 rounded-xl border shadow-sm ${getDayCardStyles(task.priority)}`}>
                  <h4 className="font-semibold text-foreground">{task.title}</h4>
                  {(task.course || task.category) && (
                    <p className="text-sm text-muted-foreground mt-1">{[task.course, task.category].filter(Boolean).join(" • ")}</p>
                  )}
                  {task.description && (
                    <p className="text-sm text-muted-foreground mt-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {isSameDay(startDate, endDate)
                        ? `${format(startDate, "h:mm a")} – ${format(endDate, "h:mm a")}`
                        : `${format(startDate, "MMM d, h:mm a")} – ${format(endDate, "MMM d, h:mm a")}`}
                    </span>
                    <Badge variant={task.priority === "urgent" ? "destructive" : task.priority === "high" ? "default" : "secondary"}>
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <main className="flex-1 flex flex-col h-full bg-muted/5 w-full">
      <header className="px-4 md:px-8 py-6 border-b bg-background flex flex-col sm:flex-row justify-between sm:items-center gap-3 z-10">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Schedule</h2>
          <p className="text-sm text-muted-foreground">View tasks by due date in weekly or monthly calendar format.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <Button variant="outline" size="icon" className="rounded-full" onClick={loadTasks} title="Refresh">
            <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => router.push('/settings')} title="Settings">
            <Settings className="h-4 w-4" />
          </Button>
          <Avatar
            className="cursor-pointer border"
            role="button"
            tabIndex={0}
            onClick={() => router.push('/settings')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                router.push('/settings');
              }
            }}
            aria-label="Open profile settings"
          >
            <AvatarImage src={profilePhotoUrl ?? undefined} alt="Profile" />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">{profileInitials}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-8 flex flex-col overflow-hidden min-h-0">
        <Tabs value={view} onValueChange={(value) => setView(value as CalendarView)} className="flex-1 flex flex-col h-full min-h-0">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <h3 className="text-xl font-bold">{getHeading(view, currentDate, weekDays)}</h3>
              <div className="flex items-center gap-1 bg-background border rounded-md p-1 shadow-sm">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handlePrevious}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" className="h-7 px-3 text-xs font-medium" onClick={handleToday}>Today</Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNext}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <TabsList className="grid grid-cols-2 w-full sm:w-[220px] shadow-sm">
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </div>
          </div>

          <Card className="flex-1 overflow-hidden flex flex-col bg-background shadow-sm border min-h-0">
            <TabsContent value="month" className="m-0 flex-1 flex-col min-h-0 data-[state=active]:flex">
              <div className="flex-1 overflow-y-auto min-h-0">
                {monthSections.map((section) => (
                  <section key={section.monthDate.toISOString()} className="rounded-lg border overflow-hidden">
                    <div className="grid grid-cols-7 border-b bg-muted/20">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
                        <div key={day} className="py-2 text-center text-xs sm:text-sm font-semibold text-muted-foreground border-r last:border-r-0">
                          <span className="hidden sm:inline">{day}</span>
                          <span className="sm:hidden">{["S", "M", "T", "W", "T", "F", "S"][idx]}</span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 auto-rows-fr bg-border gap-px">
                      {section.days.map((day) => {
                        const tasksForDay = visibleTasks.filter((task) => {
                          const d = startOfDaySafe(day);
                          return d >= startOfDaySafe(new Date(task.startTime)) && d <= startOfDaySafe(new Date(task.endTime));
                        });
                        return (
                          <button
                            type="button"
                            key={day.toISOString()}
                            onClick={() => {
                              setCurrentDate(day);
                              setView("week");
                            }}
                            className="bg-background p-1.5 sm:p-2 min-h-[80px] sm:min-h-[110px] hover:bg-muted/10 transition-colors text-left flex flex-col"
                          >
                            <span
                              className={`text-sm font-medium shrink-0 ${
                                isToday(day)
                                  ? "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center"
                                  : isSameMonth(day, section.monthDate)
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                              }`}
                            >
                              {format(day, "d")}
                            </span>
                            <div className="mt-2 space-y-1">
                              {tasksForDay.slice(0, 5).map((task) => (
                                <div
                                  key={task.id}
                                  className={`text-[10px] font-bold p-1 rounded truncate ${getEventStyles(task.priority)}`}
                                >
                                  {format(new Date(task.startTime), "ha")} {task.title}
                                </div>
                              ))}
                              {tasksForDay.length > 5 && (
                                <div className="text-[10px] text-muted-foreground">+{tasksForDay.length - 5} more</div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="week" className="m-0 flex-1 flex-col min-h-0 data-[state=active]:flex">
              {renderWeekDetails()}
            </TabsContent>

          </Card>
        </Tabs>

        <div className="mt-4 rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground">
          {urgentTasks.length > 0
            ? `${urgentTasks.length} urgent task${urgentTasks.length === 1 ? " is" : "s are"} coming up.`
            : "No urgent tasks are coming up right now."}
        </div>
      </div>
    </main>
  );
}

function getHeading(view: CalendarView, currentDate: Date, weekDays: Date[]) {
  if (view === "week") return `${format(weekDays[0], "MMMM d")} - ${format(weekDays[6], "MMMM d, yyyy")}`;
  return format(currentDate, "MMMM yyyy");
}

function startOfDaySafe(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getEventStyles(priority: Task["priority"]) {
  if (priority === "urgent") return "bg-red-100 text-red-700";
  if (priority === "high") return "bg-blue-100 text-blue-700";
  return "bg-green-100 text-green-700";
}

function getDayDotStyles(priority: Task["priority"]) {
  if (priority === "urgent") return "border-red-500";
  if (priority === "high") return "border-blue-500";
  return "border-green-500";
}

function getDayCardStyles(priority: Task["priority"]) {
  if (priority === "urgent") return "bg-red-50/50 border-red-100";
  if (priority === "high") return "bg-blue-50/50 border-blue-100";
  return "bg-green-50/50 border-green-100";
}

function getInitials(name?: string | null, email?: string | null) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "U";
  }
  if (email && email.trim()) {
    return email.trim()[0]?.toUpperCase() ?? "U";
  }
  return "U";
}
