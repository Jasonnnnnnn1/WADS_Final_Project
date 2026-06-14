import Groq from "groq-sdk";
import { Task } from "@prisma/client";
import { addDays, format } from "date-fns";

interface ScheduleRecommendation {
  taskId: string;
  suggestedDate?: string;
  suggestedTime: string;
  duration: number;
  reasoning: string;
}

interface BurnoutAnalysis {
  riskLevel: "low" | "medium" | "high";
  workload: number;
  suggestedBreakTime: number;
  recommendations: string[];
}

interface TaskInsight {
  pattern: string;
  productivity: number;
  suggestions: string[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type ChatPreferences = {
  promptStyle?: "supportive" | "direct" | "minimal";
  maxResponseLength?: "short" | "medium" | "long";
  studyMode?: "balanced" | "focus" | "exam";
  focusBlockMinutes?: number;
  breakMinutes?: number;
  characterRoleplay?: "none" | "drill_sergeant" | "witty_friend" | "cold_executive" | "socratic_tutor";
};

const MODEL_NAME = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

class GroqAIService {
  private client = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

  private ensureConfigured() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }
  }

  private async generateText(prompt: string): Promise<string> {
    this.ensureConfigured();

    const completion = await this.client.chat.completions.create({
      model: MODEL_NAME,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    });

    return completion.choices[0]?.message?.content ?? "";
  }

  /**
   * Prioritize and schedule tasks using AI
   */
  async prioritizeAndScheduleTasks(
    tasks: Task[],
    userPreferences?: {
      preferredHours?: { start: number; end: number };
      maxSessionsPerDay?: number;
      breakCadence?: number;
      allowWeekends?: boolean;
    }
  ): Promise<ScheduleRecommendation[]> {
    const pendingTasks = tasks.filter((task) => !isTaskCompleted(task.status));

    if (!pendingTasks || pendingTasks.length === 0) {
      return [];
    }

    const taskSummary = pendingTasks
      .map(
        (t) =>
          `- ${t.title} (Priority: ${t.priority}, Duration: ~${t.endTime ? Math.ceil((new Date(t.endTime).getTime() - new Date(t.startTime || new Date()).getTime()) / (1000 * 60)) : 30} min, Due: ${t.endTime || "No due date"}, Status: ${t.status})`
      )
      .join("\n");

    const prefText = userPreferences
      ? `
User Preferences:
- Preferred Study Hours: ${userPreferences.preferredHours?.start || 9}:00 - ${userPreferences.preferredHours?.end || 18}:00
- Max Sessions/Day: ${userPreferences.maxSessionsPerDay || 5}
- Break Cadence: Every ${userPreferences.breakCadence || 90} minutes
- Weekend Scheduling: ${userPreferences.allowWeekends ? "Allowed" : "Weekdays only"}
`
      : "";

    const prompt = `
You are a smart task scheduling assistant. Analyze these tasks and provide an optimal daily schedule:

${taskSummary}
${prefText}

Provide recommendations as JSON array with this format:
[
  {
    "taskId": "task-id",
    "suggestedDate": "YYYY-MM-DD",
    "suggestedTime": "HH:MM",
    "duration": minutes,
    "reasoning": "brief reason why this time is optimal"
  }
]

Consider task priority, estimated duration, due dates, and user preferences. Keep urgent/high tasks to about one per day when possible, medium tasks to a small number per day, and cluster low priority tasks more freely. Output ONLY valid JSON.
`;

    try {
      const text = await this.generateText(prompt);
      const jsonMatch = text.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as ScheduleRecommendation[];
        return normalizeScheduleRecommendations(pendingTasks, parsed, userPreferences);
      }
      return [];
    } catch (error) {
      console.error("Error prioritizing tasks:", error);
      return [];
    }
  }

  /**
   * Get smart task recommendations based on task history and patterns
   */
  async getSmartRecommendations(
    tasks: Task[],
    recentlyCompleted?: Task[]
  ): Promise<string[]> {
    if (!tasks || tasks.length === 0) {
      return [];
    }

    const incompleteTasks = tasks
      .filter((t) => !isTaskCompleted(t.status))
      .slice(0, 5)
      .map((t) => `- ${t.title} (Priority: ${t.priority})`)
      .join("\n");

    const completedSummary = recentlyCompleted?.slice(0, 3).map((t) => t.title).join(", ") || "None";

    const prompt = `
You are a productivity coach. Based on this incomplete task list and recently completed tasks, suggest 2-3 specific next actions:

Incomplete Tasks:
${incompleteTasks}

Recently Completed: ${completedSummary}

Provide recommendations as a JSON array of strings. Each should be specific and actionable. Output ONLY the JSON array.
`;

    try {
      const text = await this.generateText(prompt);
      const jsonMatch = text.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error("Error getting recommendations:", error);
      return [];
    }
  }

  /**
   * Detect burnout risk and provide recommendations
   */
  async detectBurnoutRisk(
    totalHoursWorked: number,
    tasksCompleted: number,
    tasksPending: number,
    recentSessions: number
  ): Promise<BurnoutAnalysis> {
    const workloadScore = (tasksPending / (tasksCompleted + tasksPending)) * 100 || 0;

    const prompt = `
You are a wellness advisor. Analyze this workload and suggest if burnout risk exists:

- Hours worked today: ${totalHoursWorked}
- Tasks completed: ${tasksCompleted}
- Tasks pending: ${tasksPending}
- Focus sessions done: ${recentSessions}
- Workload percentage: ${workloadScore.toFixed(1)}%

Respond with JSON:
{
  "riskLevel": "low" | "medium" | "high",
  "workload": number (0-100),
  "suggestedBreakTime": minutes,
  "recommendations": ["recommendation 1", "recommendation 2"]
}

Output ONLY valid JSON.
`;

    try {
      const text = await this.generateText(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          riskLevel: analysis.riskLevel || "low",
          workload: analysis.workload || workloadScore,
          suggestedBreakTime: analysis.suggestedBreakTime || 15,
          recommendations: analysis.recommendations || [],
        };
      }
      return {
        riskLevel: "low",
        workload: workloadScore,
        suggestedBreakTime: 15,
        recommendations: [],
      };
    } catch (error) {
      console.error("Error detecting burnout:", error);
      return {
        riskLevel: "low",
        workload: workloadScore,
        suggestedBreakTime: 15,
        recommendations: [],
      };
    }
  }

  /**
   * Analyze task patterns and provide productivity insights
   */
  async analyzeTaskPatterns(tasks: Task[]): Promise<TaskInsight[]> {
    if (!tasks || tasks.length === 0) {
      return [];
    }

    const priorityCounts = {
      high: tasks.filter((t) => t.priority === "high").length,
      medium: tasks.filter((t) => t.priority === "medium").length,
      low: tasks.filter((t) => t.priority === "low").length,
    };

    const completionRate =
      (tasks.filter((t) => isTaskCompleted(t.status)).length / tasks.length) * 100 || 0;

    const prompt = `
You are a data analyst. Provide insights on this task data:

- Total tasks: ${tasks.length}
- High priority: ${priorityCounts.high}
- Medium priority: ${priorityCounts.medium}
- Low priority: ${priorityCounts.low}
- Completion rate: ${completionRate.toFixed(1)}%

Respond with JSON array of insights:
[
  {
    "pattern": "observed pattern",
    "productivity": number (0-100),
    "suggestions": ["suggestion 1", "suggestion 2"]
  }
]

Output ONLY valid JSON array.
`;

    try {
      const text = await this.generateText(prompt);
      const jsonMatch = text.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error("Error analyzing patterns:", error);
      return [];
    }
  }

  /**
   * Parse natural language input and extract task details
   */
  async parseNaturalLanguageTask(input: string): Promise<Partial<Task>> {
    const prompt = `
Parse this natural language task description and extract structured task data:

"${input}"

Respond with JSON:
{
  "title": "task title",
  "description": "description if provided",
  "priority": "high" | "medium" | "low",
  "category": "category if mentioned",
  "course": "course/subject if mentioned",
  "startTime": "ISO timestamp or null",
  "endTime": "ISO timestamp or null",
  "estimatedDuration": minutes
}

Output ONLY valid JSON.
`;

    try {
      const text = await this.generateText(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { title: input, priority: "medium" };
    } catch (error) {
      console.error("Error parsing task:", error);
      return { title: input, priority: "medium" };
    }
  }

  /**
   * Chat with AI for general task/productivity assistance
   */
  async chat(messages: ChatMessage[], preferences: ChatPreferences = {}): Promise<string> {
    const latestUserMessage = messages[messages.length - 1]?.content ?? "";
    const history = messages
      .slice(0, -1)
      .slice(-10)
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

    const promptStyleText =
      preferences.promptStyle === "direct"
        ? "Be concise, practical, and direct."
        : preferences.promptStyle === "minimal"
          ? "Use the fewest words possible while staying useful."
          : "Be encouraging, supportive, and practical.";

    const studyModeText =
      preferences.studyMode === "focus"
        ? "Prioritize deep work, distraction removal, and focus blocks."
        : preferences.studyMode === "exam"
          ? "Prioritize exam preparation, revision, and time-boxed study plans."
          : "Balance planning, study, and healthy breaks.";

    const responseLimit =
      preferences.maxResponseLength === "short"
        ? 80
        : preferences.maxResponseLength === "long"
          ? 260
          : 160;

    const roleplayText = 
      preferences.characterRoleplay === "drill_sergeant"
        ? "Adopt the persona of a Strict Drill Sergeant. Use tough love, be highly demanding, accept zero excuses, and push the user hard to stop procrastinating."
        : preferences.characterRoleplay === "witty_friend"
          ? "Adopt the persona of a Witty Best Friend. Be highly sarcastic, humorous, and playful, but still genuinely helpful with their tasks."
          : preferences.characterRoleplay === "cold_executive"
            ? "Adopt the persona of a Cold Executive Assistant. Be completely emotionless, clinical, and detached. Zero fluff, provide only facts, bullet points, and actionable steps."
            : preferences.characterRoleplay === "socratic_tutor"
              ? "Adopt the persona of a Socratic Tutor. Instead of giving direct answers, ask guiding questions to help the user arrive at the answer themselves."
              : "Adopt your Default Assistant persona. Be your normal, friendly, and practical self.";

    const systemPrompt = `You are Jessalyne, the in-app productivity assistant for HelpImTooLazy.

  Persona:
  - Sound warm, human, witty, and genuinely present.
  - Use first person naturally.
  - Be encouraging with playful jokes when appropriate, but never mean, fake-cheerful, or overly robotic.
  - When the conversation begins, introduce yourself as Jessalyne in a short, friendly way.

  Hard constraints:
  - Primary role: productivity, study planning, task management, and app usage.
  - Refuse requests for harmful, illegal, sexual, hateful, or dangerous content.
  - Do not invent account access, personal data, or external actions you cannot perform.
  - Light casual conversation is allowed when the user wants to chat for fun; keep it friendly, safe, and brief.
  - If casual chat continues for too long, gently offer to pivot back to goals or tasks.
  - Roleplay Instruction: ${roleplayText}
  - ${promptStyleText}
  - ${studyModeText}
  - If helpful, use a study block of about ${preferences.focusBlockMinutes ?? 25} minutes with ${preferences.breakMinutes ?? 5}-minute breaks.

  Behavior rules:
  - If the user reports success or completion (for example: "I finished", "I completed", "done", "submitted"), start with genuine encouragement and acknowledge progress before giving next-step advice.
  - If the user asks how to start a task, give a concrete first action they can do in 2-5 minutes, then suggest a short focus block and one clear follow-up step.
  - If the user asks to add/create a task, help convert their idea into a clean task format: title, priority, estimated duration, and optional due date/time.
  - Offer concise, practical guidance with a witty, playful edge. Avoid generic pep talks.

  Helpful topics:
  - Task management strategies
  - Time management advice
  - Productivity tips
  - Focus techniques (Pomodoro, etc.)
  - Motivation and encouragement
  - Celebrating wins and momentum building
  - Starting tasks with low-friction first steps
  - Writing better task titles and scopes
  - Study/work planning
  - Breaking down complex tasks
  - Overcoming procrastination
  - Short, friendly, witty casual chat

  Be concise, friendly, and practical. Keep responses under ${responseLimit} words unless asked for more detail.`;

    try {
      this.ensureConfigured();

      const chatMessages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: systemPrompt,
        } satisfies Groq.Chat.Completions.ChatCompletionSystemMessageParam,
      ];

      for (const msg of history) {
        const content = msg.parts?.[0]?.text?.trim() ?? "";
        if (!content) continue;

        if (msg.role === "model") {
          chatMessages.push({
            role: "assistant",
            content,
          } satisfies Groq.Chat.Completions.ChatCompletionAssistantMessageParam);
        } else {
          chatMessages.push({
            role: "user",
            content,
          } satisfies Groq.Chat.Completions.ChatCompletionUserMessageParam);
        }
      }

      chatMessages.push({
        role: "user",
        content: latestUserMessage,
      } satisfies Groq.Chat.Completions.ChatCompletionUserMessageParam);

      const completion = await this.client.chat.completions.create({
        model: MODEL_NAME,
        temperature: 0.5,
        messages: chatMessages,
      });

      const responseText = completion.choices[0]?.message?.content ?? "";
      return trimToWordLimit(responseText, responseLimit);
    } catch (error) {
      console.error("Error in chat:", error);
      const message = error instanceof Error ? error.message : String(error ?? "");

      if (/GROQ_API_KEY is not configured/i.test(message)) {
        return "Groq is not configured yet. Please set GROQ_API_KEY in your environment and retry.";
      }

      if (/quota exceeded|Too Many Requests|rate limit|429/i.test(message)) {
        return "Groq rate limit is currently reached for this key. Please retry in a moment.";
      }

      if (/Service Unavailable|high demand|503/i.test(message)) {
        return "Groq is experiencing high demand right now. Please retry in a moment.";
      }

      if (/not found|404|model/i.test(message)) {
        return "The configured Groq model is not available. Update GROQ_MODEL to a supported model and retry.";
      }

      return "I am having trouble reaching Groq right now. Quick win: pick one small task you can finish in 10-15 minutes and start there. If you want, I can help you break your next task into a short plan.";
    }
  }

  /**
   * Generate a weekly study plan
   */
  async generateWeeklyPlan(
    tasks: Task[],
    weekStart: Date
  ): Promise<{ [day: string]: ScheduleRecommendation[] }> {
    const taskSummary = tasks
      .map(
        (t) =>
          `- ${t.title} (Priority: ${t.priority}, Est. ${t.endTime ? Math.ceil((new Date(t.endTime).getTime() - new Date(t.startTime || new Date()).getTime()) / (1000 * 60)) : 30} min)`
      )
      .join("\n");

    const prompt = `
Create a weekly study plan for these tasks starting ${weekStart.toDateString()}:

${taskSummary}

Distribute tasks across Monday-Friday for optimal learning and include breaks.
Respond with JSON object with days as keys:
{
  "Monday": [{"taskTitle": "title", "timeSlot": "09:00-10:00", "duration": 60}],
  "Tuesday": [...],
  ...
}

Output ONLY valid JSON.
`;

    try {
      const text = await this.generateText(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {};
    } catch (error) {
      console.error("Error generating weekly plan:", error);
      return {};
    }
  }
}

const groqAIService = new GroqAIService();

export default groqAIService;

function trimToWordLimit(text: string, limit: number) {
  const words = text.trim().split(/\s+/);
  if (words.length <= limit) {
    return text;
  }

  return `${words.slice(0, limit).join(" ")}...`;
}

function normalizeScheduleRecommendations(
  tasks: Task[],
  recommendations: ScheduleRecommendation[],
  userPreferences?: {
    preferredHours?: { start: number; end: number };
    maxSessionsPerDay?: number;
    breakCadence?: number;
    allowWeekends?: boolean;
  }
): ScheduleRecommendation[] {
  if (recommendations.length === 0) return [];

  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const countsByDate = new Map<string, number>();
  const allowWeekends = userPreferences?.allowWeekends ?? false;
  const baseDate = moveToNextWorkday(startOfDaySafe(new Date()), allowWeekends);
  const preferredStartHour = userPreferences?.preferredHours?.start ?? 9;
  const preferredEndHour = userPreferences?.preferredHours?.end ?? 17;

  return recommendations
    .map((item) => {
      const task = taskById.get(item.taskId);
      if (!task) return null;

      const preferredDate = item.suggestedDate ? startOfDaySafe(new Date(item.suggestedDate)) : baseDate;
      const startDate = moveToNextWorkday(preferredDate > baseDate ? preferredDate : baseDate, allowWeekends);
      const maxPerDay = getMaxTasksPerDay(task.priority, userPreferences?.maxSessionsPerDay ?? 5);

      let plannedDate = new Date(startDate);
      while (true) {
        plannedDate = moveToNextWorkday(plannedDate, allowWeekends);
        const key = plannedDate.toISOString().slice(0, 10);
        const currentCount = countsByDate.get(key) ?? 0;
        if (currentCount < maxPerDay) {
          countsByDate.set(key, currentCount + 1);
          break;
        }
        plannedDate = moveToNextWorkday(addDays(plannedDate, 1), allowWeekends);
      }

      const suggestedTime = normalizeSuggestedTime(item.suggestedTime, task.priority, preferredStartHour, preferredEndHour);

      return {
        taskId: item.taskId,
        suggestedDate: plannedDate.toISOString(),
        suggestedTime,
        duration: Math.max(30, item.duration || getTaskDurationMinutes(task)),
        reasoning: item.reasoning || `Prioritized as ${task.priority}; due ${formatDateForReason(task.endTime.toISOString())}.`,
      } satisfies ScheduleRecommendation;
    })
    .filter(Boolean) as ScheduleRecommendation[];
}

function getMaxTasksPerDay(priority: Task["priority"], defaultLimit: number) {
  if (priority === "urgent" || priority === "high") return 1;
  if (priority === "medium") return 2;
  return Math.max(4, defaultLimit);
}

function normalizeSuggestedTime(
  value: string,
  priority: Task["priority"],
  preferredStartHour: number,
  preferredEndHour: number
) {
  const defaults: Record<Task["priority"], string> = {
    urgent: `${String(Math.min(preferredStartHour, 9)).padStart(2, "0")}:00`,
    high: `${String(Math.min(preferredStartHour + 2, preferredEndHour - 1)).padStart(2, "0")}:00`,
    medium: `${String(Math.min(preferredStartHour + 4, preferredEndHour - 1)).padStart(2, "0")}:00`,
    low: `${String(Math.min(preferredStartHour + 6, preferredEndHour - 1)).padStart(2, "0")}:00`,
  };

  const fallback = defaults[priority] ?? "09:00";
  if (!/^\d{2}:\d{2}$/.test(value)) return fallback;

  const [hoursString, minutesString] = value.split(":");
  const hours = Number(hoursString);
  const minutes = Number(minutesString);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return fallback;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return fallback;

  const boundedHours = Math.min(Math.max(hours, preferredStartHour), Math.max(preferredStartHour, preferredEndHour - 1));
  return `${String(boundedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatDateForReason(value: string) {
  return format(new Date(value), "EEE, MMM d h:mm a");
}

function getTaskDurationMinutes(task: Task): number {
  const start = new Date(task.startTime).getTime();
  const end = new Date(task.endTime).getTime();
  const raw = Math.round((end - start) / 60000);
  return Math.min(180, Math.max(30, raw));
}

function startOfDaySafe(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
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

function isTaskCompleted(status: string) {
  return status.trim().toLowerCase() === "completed";
}
