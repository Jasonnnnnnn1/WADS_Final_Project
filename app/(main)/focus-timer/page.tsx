"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Play, Pause, RotateCcw, CheckCircle, Timer, Settings,
  History, Coffee, Brain, Loader2, Volume2, VolumeX, Music, Headphones,
} from "lucide-react";
import { profileApi, tasksApi, sessionsApi, type Task, type FocusSessionRecord } from "@/lib/api-client";
import { useUserSettings } from "@/lib/user-settings";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAudio } from "@/components/AudioProvider";

// ─── Mode config ──────────────────────────────────────────────────────────────
type Mode = "focus" | "short" | "long";

const MODE_CONFIG: Record<Mode, { label: string; minutes: number; color: string }> = {
  focus: { label: "Focus", minutes: 25, color: "text-blue-500" },
  short: { label: "Short Break", minutes: 5, color: "text-green-500" },
  long: { label: "Long Break", minutes: 15, color: "text-indigo-400" },
};

// ─── Study music tracks ───────────────────────────────────────────────────────
const MUSIC_TRACKS = [
  { id: "jfKfPfyJRdk", label: "Lofi Hip Hop Radio (Lofi Girl)" },
  { id: "qYnA9wWFHLI", label: "Deep Focus — Ambient Study Music" },
  { id: "WPni755-Krg", label: "Binaural Beats — Focus 40Hz" },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function getInitials(name?: string | null, email?: string | null) {
  if (name?.trim()) {
    return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
  }
  return email?.trim()[0]?.toUpperCase() ?? "U";
}

type AmbientSoundId = "white" | "brown" | "pink" | "rain" | "stream" | "cafe" | "library" | "office" | "forest" | "wind" | "ocean" | "waves" | "train" | "fan" | "campfire" | "thunder" | "traffic";

const AMBIENT_SOUNDS: Array<{
  id: AmbientSoundId;
  label: string;
  description: string;
  color: string;
  activeColor: string;
}> = [
  {
    id: "white",
    label: "White noise",
    description: "Balanced, clean static",
    color: "text-blue-500",
    activeColor: "border-blue-400 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium",
  },
  {
    id: "brown",
    label: "Brown noise",
    description: "Deep, muted rumble",
    color: "text-indigo-500",
    activeColor: "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium",
  },
  {
    id: "pink",
    label: "Pink noise",
    description: "Mid-range tone, soothing",
    color: "text-rose-500",
    activeColor: "border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium",
  },
  {
    id: "rain",
    label: "Rain",
    description: "Sparse drops with hum",
    color: "text-cyan-500",
    activeColor: "border-cyan-400 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-medium",
  },
  {
    id: "stream",
    label: "Stream",
    description: "Flowing water, gentle",
    color: "text-teal-500",
    activeColor: "border-teal-400 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-medium",
  },
  {
    id: "cafe",
    label: "Cafe",
    description: "Chatter and ambient hum",
    color: "text-amber-500",
    activeColor: "border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-medium",
  },
  {
    id: "library",
    label: "Library",
    description: "Quiet room with page turns",
    color: "text-stone-500",
    activeColor: "border-stone-400 bg-stone-50 dark:bg-stone-950/40 text-stone-700 dark:text-stone-300 font-medium",
  },
  {
    id: "office",
    label: "Office",
    description: "Keyboard and desk ambience",
    color: "text-neutral-500",
    activeColor: "border-neutral-400 bg-neutral-50 dark:bg-neutral-950/40 text-neutral-700 dark:text-neutral-300 font-medium",
  },
  {
    id: "forest",
    label: "Forest",
    description: "Birds and rustling leaves",
    color: "text-green-500",
    activeColor: "border-green-400 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 font-medium",
  },
  {
    id: "wind",
    label: "Wind",
    description: "Rustling, gentle",
    color: "text-emerald-500",
    activeColor: "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium",
  },
  {
    id: "ocean",
    label: "Ocean",
    description: "Rhythmic tide motion",
    color: "text-blue-600",
    activeColor: "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium",
  },
  {
    id: "waves",
    label: "Waves",
    description: "Ocean rhythm, soothing",
    color: "text-sky-500",
    activeColor: "border-sky-400 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-medium",
  },
  {
    id: "train",
    label: "Train",
    description: "Rhythmic cabin rumble",
    color: "text-violet-500",
    activeColor: "border-violet-400 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-medium",
  },
  {
    id: "fan",
    label: "Fan hum",
    description: "Steady mechanical drone",
    color: "text-slate-500",
    activeColor: "border-slate-400 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 font-medium",
  },
  {
    id: "campfire",
    label: "Campfire",
    description: "Crackling with warmth",
    color: "text-orange-500",
    activeColor: "border-orange-400 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-medium",
  },
  {
    id: "thunder",
    label: "Thunder",
    description: "Deep rumbling storms",
    color: "text-purple-500",
    activeColor: "border-purple-400 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-medium",
  },
  {
    id: "traffic",
    label: "Traffic",
    description: "Distant vehicular rumble",
    color: "text-zinc-500",
    activeColor: "border-zinc-400 bg-zinc-50 dark:bg-zinc-950/40 text-zinc-700 dark:text-zinc-300 font-medium",
  },
];

const SOUND_GROUPS = [
  { title: "Noise", ids: ["white", "brown", "pink"] as AmbientSoundId[] },
  { title: "Nature", ids: ["rain", "stream", "forest", "wind", "ocean", "waves", "campfire", "thunder"] as AmbientSoundId[] },
  { title: "Ambient", ids: ["cafe", "library", "office", "train", "fan", "traffic"] as AmbientSoundId[] },
];

const SOUND_BADGE_COLOR: Record<AmbientSoundId, string> = {
  white: "bg-blue-500",
  brown: "bg-indigo-500",
  pink: "bg-rose-500",
  rain: "bg-cyan-500",
  stream: "bg-teal-500",
  cafe: "bg-amber-500",
  library: "bg-stone-500",
  office: "bg-neutral-500",
  forest: "bg-green-500",
  wind: "bg-emerald-500",
  ocean: "bg-blue-600",
  waves: "bg-sky-500",
  train: "bg-violet-500",
  fan: "bg-slate-500",
  campfire: "bg-orange-500",
  thunder: "bg-purple-500",
  traffic: "bg-zinc-500",
};

// ─── Sounds panel ─────────────────────────────────────────────────────────────
function SoundsPanel() {
  const audio = useAudio();

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
        <Music className="h-3.5 w-3.5" /> Sounds
      </p>

      <div className="space-y-3">
        {SOUND_GROUPS.map((group) => (
          <div key={group.title} className="space-y-2">
            <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{group.title}</p>
            <div className="grid grid-cols-1 gap-2">
              {group.ids.map((id) => {
                const sound = AMBIENT_SOUNDS.find((item) => item.id === id)!;
                const isActive = audio.activeAmbientSounds.includes(sound.id);
                return (
                  <button
                    key={sound.id}
                    onClick={() => audio.toggleAmbientSound(sound.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg border text-sm transition-colors flex items-start gap-2
                      ${isActive
                        ? sound.activeColor
                        : "border-transparent hover:border-border hover:bg-muted/50 text-muted-foreground"}`}
                  >
                    {isActive
                      ? <Volume2 className={`h-4 w-4 shrink-0 mt-0.5 ${sound.color}`} />
                      : <VolumeX className="h-4 w-4 shrink-0 mt-0.5" />}
                    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="truncate">{sound.label}</span>
                        {isActive && <Badge className={`text-[10px] px-1.5 py-0 ${SOUND_BADGE_COLOR[sound.id]}`}>ON</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground/80">{sound.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="px-1 text-xs text-muted-foreground flex items-center gap-1.5 leading-snug">
        <Headphones className="h-3.5 w-3.5 shrink-0" />
        Headphones recommended for the best experience.
      </p>

      <div className="space-y-1 px-1 pt-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Volume</span>
          <span>{Math.round(audio.ambientVolume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={audio.ambientVolume}
          onChange={(e) => audio.setAmbientVolume(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </div>

      {/* Music */}
      <div className="space-y-2 pt-1">
        <select
          value={audio.musicTrackId}
          onChange={(e) => {
            audio.setMusicTrackId(e.target.value);
            audio.setMusicPlaying(false);
          }}
          className="w-full text-xs rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {MUSIC_TRACKS.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>

        <button
          onClick={() => audio.setMusicPlaying(!audio.musicPlaying)}
          className={`w-full px-3 py-2.5 rounded-lg border text-sm transition-colors flex items-center gap-2
            ${audio.musicPlaying
              ? "border-green-400 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 font-medium"
              : "border-transparent hover:border-border hover:bg-muted/50 text-muted-foreground"}`}
        >
          {audio.musicPlaying
            ? <Pause className="h-4 w-4 shrink-0 fill-current" />
            : <Play className="h-4 w-4 shrink-0 fill-current" />}
          <span>{audio.musicPlaying ? "Stop music" : "Play study music"}</span>
          {audio.musicPlaying && (
            <Badge className="ml-auto text-[10px] px-1.5 py-0 bg-green-500">LIVE</Badge>
          )}
        </button>
      </div>

      <button
        onClick={audio.stopAllSounds}
        className="w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors flex items-center gap-2 border-transparent hover:border-border hover:bg-muted/50 text-muted-foreground"
      >
        <RotateCcw className="h-4 w-4 shrink-0" />
        <span>Stop all sounds</span>
      </button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FocusTimerPage() {
  const router = useRouter();

  // ── Auth state ──
  const [displayName, setDisplayName] = React.useState("there");
  const [profilePhotoUrl, setProfilePhotoUrl] = React.useState<string | null>(null);
  const [profileInitials, setProfileInitials] = React.useState("U");

  // ── Tasks ──
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = React.useState(true);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);

  // ── Timer ──
    const { settings } = useUserSettings();

    const [mode, setMode] = React.useState<Mode>("focus");
    const initialFocus = typeof settings?.focusTimerDefaults?.focus === "number" ? settings.focusTimerDefaults.focus : MODE_CONFIG.focus.minutes;
    const initialShort = typeof settings?.focusTimerDefaults?.short === "number" ? settings.focusTimerDefaults.short : MODE_CONFIG.short.minutes;
    const initialLong = typeof settings?.focusTimerDefaults?.long === "number" ? settings.focusTimerDefaults.long : MODE_CONFIG.long.minutes;
    const derivedConfig = React.useMemo(() => ({
      focus: { ...MODE_CONFIG.focus, minutes: initialFocus },
      short: { ...MODE_CONFIG.short, minutes: initialShort },
      long: { ...MODE_CONFIG.long, minutes: initialLong },
    }), [initialFocus, initialShort, initialLong]);

    const [secondsLeft, setSecondsLeft] = React.useState(derivedConfig.focus.minutes * 60);
  const [running, setRunning] = React.useState(false);
  const startedAtRef = React.useRef<string | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Sessions ──
  const [sessions, setSessions] = React.useState<FocusSessionRecord[]>([]);
  const [toast, setToast] = React.useState<{ msg: string; ok: boolean } | null>(null);

  // ── Load auth ──
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      const n = user?.displayName?.trim() || "there";
      setDisplayName(n.split(" ")[0] || "there");
      setProfileInitials(getInitials(user?.displayName, user?.email));
      if (!user) { setProfilePhotoUrl(null); return; }
      try {
        const profile = await profileApi.get();
        setProfilePhotoUrl(profile.profilePhotoUrl ?? user.photoURL ?? null);
      } catch {
        setProfilePhotoUrl(user.photoURL ?? null);
      }
    });
    return unsub;
  }, []);

  // ── Load tasks ──
  React.useEffect(() => {
    tasksApi.list()
      .then((data) => setTasks(data.filter((t) => t.status !== "completed")))
      .catch(() => { })
      .finally(() => setLoadingTasks(false));
  }, []);

  // ── Load sessions history ──
  React.useEffect(() => {
    sessionsApi.list().then(setSessions).catch(() => { });
  }, []);

  // ── Timer countdown ──
  React.useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function switchMode(next: Mode) {
    if (running) { if (intervalRef.current) clearInterval(intervalRef.current); setRunning(false); }
    setMode(next);
    setSecondsLeft(derivedConfig[next].minutes * 60);
    startedAtRef.current = null;
  }

  function handleStart() {
    if (!running) {
      if (!startedAtRef.current) startedAtRef.current = new Date().toISOString();
      setRunning(true);
    }
  }

  function handlePause() { setRunning(false); }

  function handleReset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setSecondsLeft(derivedConfig[mode].minutes * 60);
    startedAtRef.current = null;
  }

  async function handleTimerComplete() {
    if (mode !== "focus") { showToast("Break over! Time to focus.", true); return; }
    const completedAt = new Date().toISOString();
    const startedAt = startedAtRef.current ?? completedAt;
    const durationMinutes = derivedConfig[mode].minutes;
    try {
      const saved = await sessionsApi.create({ taskId: selectedTaskId ?? undefined, durationMinutes, startedAt, completedAt });
      setSessions((prev) => [saved, ...prev]);
      showToast(`Focus session complete! ${durationMinutes} min logged.`, true);
    } catch {
      showToast("Session complete — couldn't save to history.", false);
    }
    startedAtRef.current = null;
  }

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  // ── SVG ring ──
  const totalSeconds = derivedConfig[mode].minutes * 60;
  const RADIUS = 88;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const dashOffset = CIRCUMFERENCE * (1 - secondsLeft / totalSeconds);
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  return (
    <div className="flex flex-col h-full bg-muted/5">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b bg-background shrink-0">
        <div className="flex items-center gap-2">
          <Timer className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Focus Timer</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-full" onClick={() => router.push("/settings")} title="Settings">
            <Settings className="h-4 w-4" />
          </Button>
          <Avatar
            className="cursor-pointer border ml-1"
            role="button"
            tabIndex={0}
            onClick={() => router.push("/settings")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push("/settings"); } }}
            aria-label="Open profile settings"
          >
            <AvatarImage src={profilePhotoUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">{profileInitials}</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden flex-col lg:flex-row">

        {/* TIMER COLUMN */}
        <div className="flex flex-1 flex-col items-center justify-start lg:justify-center gap-5 px-4 sm:px-6 py-6 overflow-y-auto">

          {/* Mode tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {(["focus", "short", "long"] as Mode[]).map((m) => (
              <Button key={m} variant={mode === m ? "default" : "outline"} size="sm" onClick={() => switchMode(m)}>
                {m === "focus" ? <Brain className="mr-1.5 h-3.5 w-3.5" /> : <Coffee className="mr-1.5 h-3.5 w-3.5" />}
                {derivedConfig[m].label}
              </Button>
            ))}
          </div>

          {/* Ring */}
          <div className="relative flex items-center justify-center">
            <svg width="200" height="200" viewBox="0 0 220 220" className="transform -rotate-90 w-[180px] h-[180px] sm:w-[220px] sm:h-[220px]">
              <circle cx="110" cy="110" r={RADIUS} stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/30" />
              <circle
                cx="110" cy="110" r={RADIUS} stroke="currentColor" strokeWidth="8" fill="transparent"
                strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset}
                strokeLinecap="round"
                className={`transition-all duration-1000 ${derivedConfig[mode].color}`}
              />
            </svg>
            <div className="absolute flex flex-col items-center select-none">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-1">
                {derivedConfig[mode].label}
              </span>
              <span className="text-5xl font-bold tabular-nums tracking-tight">{fmt(secondsLeft)}</span>
              {selectedTask && (
                <span className="text-xs text-muted-foreground mt-1.5 max-w-[140px] truncate text-center">
                  {selectedTask.title}
                </span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" className="rounded-full w-11 h-11" onClick={handleReset} title="Reset">
              <RotateCcw className="h-4 w-4" />
            </Button>
            {running ? (
              <Button size="lg" className="rounded-full w-16 h-16 shadow-md" onClick={handlePause} title="Pause">
                <Pause className="fill-current h-6 w-6" />
              </Button>
            ) : (
              <Button size="lg" className="rounded-full w-16 h-16 shadow-md" onClick={handleStart} title="Start">
                <Play className="fill-current h-6 w-6 ml-1" />
              </Button>
            )}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full w-11 h-11" title="Sounds and music">
                  <Music className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl p-0 h-[85vh] max-h-[85vh] flex flex-col overflow-hidden">
                <DialogHeader className="px-5 pt-5 pb-0 shrink-0">
                  <DialogTitle className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Sounds and Music
                  </DialogTitle>
                </DialogHeader>
                <div className="px-5 pb-5 pt-3 flex-1 min-h-0 overflow-y-auto">
                  <SoundsPanel />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            {running
              ? mode === "focus" ? "Stay focused. You've got this." : "Take a breather."
              : secondsLeft === 0 ? "Session complete!" : "Press play to start."}
          </p>

          {/* MOBILE/TABLET: Task Selector + History inline */}
          <div className="lg:hidden w-full max-w-sm space-y-4 border-t pt-4">
            {mode === "focus" && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">Focusing on</p>
                {loadingTasks ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm p-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading tasks…
                  </div>
                ) : tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-1">No pending tasks.</p>
                ) : (
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedTaskId(null)}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${selectedTaskId === null ? "border-primary bg-primary/5 font-medium" : "border-transparent hover:border-border hover:bg-muted/50 text-muted-foreground"}`}
                    >
                      None — free session
                    </button>
                    {tasks.slice(0, 5).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition-colors ${selectedTaskId === t.id ? "border-primary bg-primary/5 font-medium" : "border-transparent hover:border-border hover:bg-muted/50"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate">{t.title}</span>
                          <Badge variant={t.priority === "urgent" ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0 shrink-0">
                            {t.priority}
                          </Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className={`${mode === "focus" ? "border-t pt-4" : ""}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1 flex items-center gap-1.5">
                <History className="h-3.5 w-3.5" /> Session History
              </p>
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground px-1 py-2 text-center">Complete a session to see it here.</p>
              ) : (
                <div className="space-y-1.5">
                  {sessions.slice(0, 5).map((s) => {
                    const linkedTask = tasks.find((t) => t.id === s.taskId);
                    return (
                      <div key={s.id} className="px-3 py-2 rounded-lg bg-muted/40 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                          <span className="font-medium">{s.durationMinutes} min</span>
                          {linkedTask && <span className="text-muted-foreground truncate text-xs">— {linkedTask.title}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 pl-5">
                          {new Date(s.completedAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — sidebar (desktop only) */}
        <div className="hidden lg:flex w-72 xl:w-80 border-l bg-background flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">

              {/* Task selector */}
              {mode === "focus" && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                    Focusing on
                  </p>
                  {loadingTasks ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm p-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading tasks…
                    </div>
                  ) : tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-1">No pending tasks found.</p>
                  ) : (
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedTaskId(null)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${selectedTaskId === null ? "border-primary bg-primary/5 font-medium" : "border-transparent hover:border-border hover:bg-muted/50 text-muted-foreground"}`}
                      >
                        None — free session
                      </button>
                      {tasks.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTaskId(t.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${selectedTaskId === t.id ? "border-primary bg-primary/5 font-medium" : "border-transparent hover:border-border hover:bg-muted/50"}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">{t.title}</span>
                            <Badge variant={t.priority === "urgent" ? "destructive" : "secondary"} className="text-[10px] px-1.5 py-0 shrink-0">
                              {t.priority}
                            </Badge>
                          </div>
                          {(t.course || t.category) && (
                            <span className="text-xs text-muted-foreground mt-0.5 block">
                              {[t.course, t.category].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Session History */}
              <div className={`${mode === "focus" ? "border-t pt-4" : ""}`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5" /> Session History
                </p>
                {sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-1 py-3 text-center">
                    Complete a session to see it here.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {sessions.map((s) => {
                      const linkedTask = tasks.find((t) => t.id === s.taskId);
                      return (
                        <div key={s.id} className="px-3 py-2.5 rounded-lg bg-muted/40 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                            <span className="font-medium">{s.durationMinutes} min</span>
                            {linkedTask && (
                              <span className="text-muted-foreground truncate text-xs ml-0.5">
                                — {linkedTask.title}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 pl-5">
                            {new Date(s.completedAt).toLocaleString([], {
                              month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium text-white transition-all ${toast.ok ? "bg-green-600" : "bg-amber-600"}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
