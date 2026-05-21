import { auth } from "@/lib/firebase";
import type { Task, TaskStatus, TaskPriority } from "@/lib/store";

export type { Task, TaskStatus, TaskPriority };

async function getToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 20000
): Promise<T> {
  const token = await getToken();
  const controller = options.signal ? null : new AbortController();
  const timeoutId = controller
    ? setTimeout(() => {
        controller.abort();
      }, timeoutMs)
    : null;

  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      signal: options.signal ?? controller?.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers ?? {}),
      },
    });
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw err;
  }

  if (timeoutId) clearTimeout(timeoutId);

  // Robust JSON handling so we don't crash on empty/invalid responses
  let rawBody: string | null = null;
  try {
    rawBody = await res.text();
    if (!rawBody) {
      throw new Error(`Empty response body (status ${res.status})`);
    }

    const json = JSON.parse(rawBody) as {
      success: boolean;
      data?: T;
      error?: string;
    };

    if (!json.success) {
      throw new Error(json.error ?? "API error");
    }

    return json.data as T;
  } catch (err) {
    // Surface a clearer, high-level error to the UI
    console.error("Failed to parse API response", {
      path,
      status: res.status,
      rawBody,
      error: err,
    });
    throw new Error("Server returned an invalid response. Please try again.");
  }
}

export type CreateTaskInput = {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  course?: string;
  taskLink?: string;
  attachmentName?: string;
  attachmentMimeType?: string;
  attachmentDataUrl?: string;
  startTime: string;
  endTime: string;
};

export type CreateSessionInput = {
  taskId?: string;
  durationMinutes: number;
  startedAt: string;
  completedAt: string;
  notes?: string;
};

export type FocusSessionRecord = {
  id: string;
  userId: string;
  taskId: string | null;
  durationMinutes: number;
  startedAt: string;
  completedAt: string;
  notes: string;
};

export type UserProfile = {
  userId: string;
  email: string | null;
  displayName: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  university: string | null;
  major: string | null;
  profilePhotoUrl: string | null;
  profileCompleted: boolean;
};

export type UpdateProfileInput = {
  username: string;
  firstName: string;
  lastName: string;
  university?: string;
  major?: string;
  profilePhotoUrl?: string | null;
};

export type AIPrioritizeItem = {
  taskId: string;
  suggestedDate?: string;
  suggestedTime: string;
  duration: number;
  reasoning: string;
};

export type AIPrioritizePreferences = {
  preferredHours?: { start: number; end: number };
  maxSessionsPerDay?: number;
  breakCadence?: number;
  allowWeekends?: boolean;
};

export type AIBurnoutAnalysis = {
  analysis: {
    riskLevel: "low" | "medium" | "high";
    workload: number;
    suggestedBreakTime: number;
    recommendations: string[];
  };
  stats: {
    totalHours: number;
    completedTasks: number;
    pendingTasks: number;
    sessionsDone: number;
  };
};

export type AIRecommendationsResponse = {
  recommendations: string[];
  incompleteTasks: number;
  completedTasks: number;
};

export type AIInsightsResponse = {
  insights: Array<{
    pattern: string;
    productivity: number;
    suggestions: string[];
  }>;
  stats: {
    totalTasks: number;
    completed: number;
    pending: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
  };
};

export type AnalyticsResponse = {
  tasks: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    completionRate: number;
  };
  focusTime: {
    totalMinutes: number;
    totalHours: number;
    weeklyMinutes: number;
    sessionCount: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  trends: Array<{
    month: string;
    label: string;
    focusMinutes: number;
    completedTasks: number;
    sessions: number;
  }>;
  streak: {
    current: number;
    longest: number;
    active: boolean;
  };
};

export type AITaskParseResponse = {
  task: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    category?: string;
    course?: string;
    startTime?: string;
    endTime?: string;
  };
};

export const sessionsApi = {
  list: () => apiFetch<FocusSessionRecord[]>("/api/sessions?page=1&pageSize=200"),
  create: (input: CreateSessionInput) =>
    apiFetch<FocusSessionRecord>("/api/sessions", { method: "POST", body: JSON.stringify(input) }),
};

export const tasksApi = {
  list: () => apiFetch<Task[]>("/api/tasks?page=1&pageSize=200"),
  create: (input: CreateTaskInput) =>
    apiFetch<Task>("/api/tasks", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: Partial<CreateTaskInput>) =>
    apiFetch<Task>(`/api/tasks/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  remove: (id: string) =>
    apiFetch<{ deleted: boolean }>(`/api/tasks/${id}`, { method: "DELETE" }),
};

export const profileApi = {
  get: () => apiFetch<UserProfile>("/api/profile"),
  update: (input: UpdateProfileInput) =>
    apiFetch<UserProfile>("/api/profile", { method: "PUT", body: JSON.stringify(input) }),
};

export const accountApi = {
  remove: () => apiFetch<{ deleted: boolean }>("/api/account", { method: "DELETE" }),
};

export const aiApi = {
  prioritize: (preferences?: AIPrioritizePreferences) =>
    apiFetch<{ recommendations: AIPrioritizeItem[]; taskCount: number }>("/api/ai/prioritize", {
      method: "POST",
      body: JSON.stringify({ preferences: preferences ?? {} }),
    }, 15000),
  recommendations: () => apiFetch<AIRecommendationsResponse>("/api/ai/recommendations", {}, 8000),
  burnout: () => apiFetch<AIBurnoutAnalysis>("/api/ai/burnout", {}, 8000),
  insights: () => apiFetch<AIInsightsResponse>("/api/ai/insights"),
  parseTask: (text: string) => apiFetch<AITaskParseResponse>("/api/ai/parse-task", { method: "POST", body: JSON.stringify({ text }) }),
};

export const analyticsApi = {
  get: () => apiFetch<AnalyticsResponse>("/api/analytics"),
};

export type UserSettingsPayload = {
  notificationRules?: Record<string, unknown>;
  calendarPreferences?: Record<string, unknown>;
  focusTimerDefaults?: Record<string, unknown>;
  privacyControls?: Record<string, unknown>;
  appearanceSettings?: Record<string, unknown>;
};

export const settingsApi = {
  get: () => apiFetch<UserSettingsPayload>("/api/settings"),
  update: (payload: UserSettingsPayload) => apiFetch<UserSettingsPayload>("/api/settings", { method: "PUT", body: JSON.stringify(payload) }),
};
