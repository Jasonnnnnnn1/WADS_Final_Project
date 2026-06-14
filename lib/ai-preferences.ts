export type AIPromptStyle = "supportive" | "direct" | "minimal";
export type AIMaxResponseLength = "short" | "medium" | "long";
export type AIStudyMode = "balanced" | "focus" | "exam";
export type AICharacterRoleplay = "none" | "drill_sergeant" | "witty_friend" | "cold_executive" | "socratic_tutor";

export type AISettings = {
  promptStyle: AIPromptStyle;
  maxResponseLength: AIMaxResponseLength;
  studyMode: AIStudyMode;
  focusBlockMinutes: number;
  breakMinutes: number;
  workStartHour: number;
  workEndHour: number;
  allowWeekendScheduling: boolean;
  characterRoleplay: AICharacterRoleplay;
};

export const DEFAULT_AI_SETTINGS: AISettings = {
  promptStyle: "supportive",
  maxResponseLength: "medium",
  studyMode: "balanced",
  focusBlockMinutes: 25,
  breakMinutes: 5,
  workStartHour: 10,
  workEndHour: 18,
  allowWeekendScheduling: false,
  characterRoleplay: "none",
};

const STORAGE_KEY = "helpimtoolazy-ai-settings";

export function loadAISettings(): AISettings {
  if (typeof window === "undefined") {
    return DEFAULT_AI_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_AI_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<AISettings>;
    const workStartHour = clampNumber(parsed.workStartHour, 6, 14, DEFAULT_AI_SETTINGS.workStartHour);
    const workEndHour = clampNumber(parsed.workEndHour, 12, 23, DEFAULT_AI_SETTINGS.workEndHour);
    return {
      promptStyle: isPromptStyle(parsed.promptStyle) ? parsed.promptStyle : DEFAULT_AI_SETTINGS.promptStyle,
      maxResponseLength: isMaxResponseLength(parsed.maxResponseLength)
        ? parsed.maxResponseLength
        : DEFAULT_AI_SETTINGS.maxResponseLength,
      studyMode: isStudyMode(parsed.studyMode) ? parsed.studyMode : DEFAULT_AI_SETTINGS.studyMode,
      focusBlockMinutes: clampNumber(parsed.focusBlockMinutes, 15, 90, DEFAULT_AI_SETTINGS.focusBlockMinutes),
      breakMinutes: clampNumber(parsed.breakMinutes, 3, 30, DEFAULT_AI_SETTINGS.breakMinutes),
      workStartHour,
      workEndHour: Math.max(workStartHour + 2, workEndHour),
      allowWeekendScheduling: Boolean(parsed.allowWeekendScheduling),
      characterRoleplay: isCharacterRoleplay(parsed.characterRoleplay) ? parsed.characterRoleplay : DEFAULT_AI_SETTINGS.characterRoleplay,
    };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveAISettings(settings: AISettings) {
  if (typeof window === "undefined") {
    return;
  }

  const normalized: AISettings = {
    ...settings,
    workStartHour: clampNumber(settings.workStartHour, 6, 14, DEFAULT_AI_SETTINGS.workStartHour),
    workEndHour: Math.max(
      clampNumber(settings.workStartHour, 6, 14, DEFAULT_AI_SETTINGS.workStartHour) + 2,
      clampNumber(settings.workEndHour, 12, 23, DEFAULT_AI_SETTINGS.workEndHour)
    ),
    allowWeekendScheduling: Boolean(settings.allowWeekendScheduling),
    characterRoleplay: isCharacterRoleplay(settings.characterRoleplay) ? settings.characterRoleplay : DEFAULT_AI_SETTINGS.characterRoleplay,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event("ai-settings-updated"));
}

export function getMaxResponseWordLimit(length: AIMaxResponseLength) {
  if (length === "short") return 80;
  if (length === "long") return 260;
  return 160;
}

function isPromptStyle(value: unknown): value is AIPromptStyle {
  return value === "supportive" || value === "direct" || value === "minimal";
}

function isMaxResponseLength(value: unknown): value is AIMaxResponseLength {
  return value === "short" || value === "medium" || value === "long";
}

function isStudyMode(value: unknown): value is AIStudyMode {
  return value === "balanced" || value === "focus" || value === "exam";
}

function isCharacterRoleplay(value: unknown): value is AICharacterRoleplay {
  return value === "none" || value === "drill_sergeant" || value === "witty_friend" || value === "cold_executive" || value === "socratic_tutor";
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(numericValue)));
}
