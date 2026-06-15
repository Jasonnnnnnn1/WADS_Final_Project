"use client";

import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !done.current) {
          done.current = true;
          const step = target / 60;
          let cur = 0;
          const t = setInterval(() => {
            cur += step;
            if (cur >= target) { setVal(target); clearInterval(t); }
            else setVal(Math.floor(cur));
          }, 16);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, [target]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

function Shapes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0" aria-hidden>
      <div className="absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-indigo-600 opacity-10 sm:opacity-40 lg:opacity-90"
        style={{ animation: "floatA 8s ease-in-out infinite" }} />
      <div className="absolute right-40 top-10 h-20 w-20 rounded-lg bg-amber-400 opacity-20 sm:opacity-50 lg:opacity-100"
        style={{ transform: "rotate(15deg)", animation: "floatB 6s ease-in-out infinite" }} />
      <div className="absolute right-64 top-48 h-10 w-10 rounded-full bg-slate-900 opacity-10 sm:opacity-40 lg:opacity-100"
        style={{ animation: "floatC 7s ease-in-out infinite" }} />
      <div className="absolute right-16 top-80 h-24 w-24 rounded-full border-8 border-white bg-transparent opacity-20 lg:opacity-100"
        style={{ animation: "floatA 9s ease-in-out infinite reverse" }} />
      <div className="absolute right-80 top-36 h-14 w-14 rounded-xl bg-purple-500 opacity-10 lg:opacity-80"
        style={{ transform: "rotate(-20deg)", animation: "floatB 5s ease-in-out infinite reverse" }} />
      <div className="absolute left-1/3 top-8 h-4 w-4 rounded-full bg-indigo-400 opacity-30 lg:opacity-60" />
      <div className="absolute left-1/3 top-16 h-3 w-3 rounded-full bg-purple-400 opacity-30 lg:opacity-50"
        style={{ marginLeft: 20 }} />
      <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-200/60 to-purple-200/40 blur-2xl opacity-50 lg:opacity-100"
        style={{ animation: "floatC 10s ease-in-out infinite" }} />
    </div>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────
const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="4" width="18" height="18" rx="3" />
        <path d="M16 2v4M8 2v4M3 10h18" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeLinecap="round" />
      </svg>
    ),
    title: "Intentional Planning",
    desc: "Shape your week with soft deadlines and a single daily focus. Know exactly what matters most every morning.",
    bg: "bg-indigo-50", text: "text-indigo-600",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" strokeLinecap="round" />
      </svg>
    ),
    title: "Focus Sessions",
    desc: "Timed deep work blocks that eliminate distraction. Build real concentration habits through consistent practice.",
    bg: "bg-purple-50", text: "text-purple-600",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth={2}>
        <path d="M3 17l4-8 4 4 4-6 4 6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 21h18" strokeLinecap="round" />
      </svg>
    ),
    title: "Momentum Tracking",
    desc: "See streaks, wins, and time reclaimed at a glance. Celebrate progress, not just perfection.",
    bg: "bg-amber-50", text: "text-amber-600",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth={2}>
        <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" />
      </svg>
    ),
    title: "Adaptive Schedules",
    desc: "Life changes — your plan should too. Reschedule tasks in seconds without losing context or momentum.",
    bg: "bg-emerald-50", text: "text-emerald-600",
  },
];

const steps = [
  { num: "01", title: "Capture your tasks", desc: "Dump every idea and assignment into one clean list — no friction." },
  { num: "02", title: "Set your daily focus", desc: "Pick the three things that matter most today. The app surfaces them front and center." },
  { num: "03", title: "Work in focused blocks", desc: "Start a timed session for any task. Zero distractions, full momentum." },
  { num: "04", title: "Review & improve", desc: "See what you finished, adjust tomorrow's plan, and keep the streak going." },
];

const reviews = [
  {
    name: "Michael Arianno Chandrarieta",
    initials: "MA",
    color: "bg-indigo-500",
    role: "Computer Science Student",
    stars: 5,
    quote: "HelpImTooLazy completely changed how I study. I used to lose hours to context switching — now I finish my focus sessions and actually feel productive. The daily focus picker is a game-changer.",
  },
  {
    name: "Jason Franto Fong",
    initials: "JF",
    color: "bg-purple-500",
    role: "Information Systems Student",
    stars: 5,
    quote: "I was skeptical at first, but the momentum tracking keeps me accountable in a way no other app has. Seeing my streak grow is weirdly motivating. Genuinely the best study tool I've used.",
  },
];

const stats = [
  { value: 94, suffix: "%", label: "Report Better Focus" },
  { value: 120000, suffix: "+", label: "Tasks Completed" },
  { value: 4, suffix: ".9 ★", label: "Average Rating" },
];

// ─── Page ──────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes floatA { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes floatB { 0%,100%{transform:translateY(0) rotate(15deg)} 50%{transform:translateY(-12px) rotate(20deg)} }
        @keyframes floatC { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp 0.65s ease both; }
        .delay-1 { animation-delay:.08s }
        .delay-2 { animation-delay:.18s }
        .delay-3 { animation-delay:.28s }
      `}</style>

      <main className={`${spaceGrotesk.className} min-h-screen bg-[#f7f7fb] text-slate-900 antialiased`}>

        {/* NAV */}
        <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
                <svg viewBox="0 0 20 20" fill="white" className="h-4 w-4">
                  <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 3a1 1 0 011 1v3.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 019 10V6a1 1 0 011-1z" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight">HelpImTooLazy</span>
            </div>
            <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
              <a href="#features" className="transition-colors hover:text-indigo-600">Features</a>
              <a href="#how-it-works" className="transition-colors hover:text-indigo-600">How it works</a>
              <a href="#reviews" className="transition-colors hover:text-indigo-600">Reviews</a>
            </div>
            <Button asChild className="rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/30 px-4 sm:px-6">
              <Link href="/login">Get Started</Link>
            </Button>
          </div>
        </nav>

        {/* HERO */}
        <section className="relative min-h-[90vh] overflow-hidden">
          <Shapes />
          <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-6xl flex-col justify-center px-6 py-20">
            <div className="max-w-2xl">
              <Badge variant="outline" className="mb-6 gap-1.5 rounded-full border-indigo-100 bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600 fade-up">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Your Personal Study Companion
              </Badge>

              <h1 className="fade-up delay-1 text-4xl font-bold leading-[1.12] tracking-tight sm:text-6xl lg:text-7xl">
                Focus smarter.<br />
                <span className="text-indigo-600">Study harder.</span><br />
                Achieve more.
              </h1>

              <p className="fade-up delay-2 mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
                HelpImTooLazy turns scattered tasks into a focused daily plan. Capture ideas,
                schedule your energy, and build momentum — one session at a time.
              </p>

              <div className="fade-up delay-3 mt-8 flex flex-wrap items-center gap-4">
                <Button asChild size="lg" className="group rounded-full bg-indigo-600 px-8 hover:bg-indigo-700 shadow-lg shadow-indigo-600/25 hover:shadow-xl hover:shadow-indigo-600/30 transition-all hover:-translate-y-0.5">
                  <Link href="/login">
                    Start for free
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8.293 3.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L10.586 9H3a1 1 0 010-2h7.586L8.293 4.707a1 1 0 010-1.414z" />
                    </svg>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full border-slate-200 px-8 hover:border-indigo-200 hover:text-indigo-600 transition-all hover:-translate-y-0.5">
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="border-y border-slate-100 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-4xl font-bold text-indigo-600">
                    <Counter target={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="bg-[#f7f7fb] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-14 text-center">
              <Badge variant="outline" className="rounded-full border-indigo-100 bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600">
                Features
              </Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
                Everything you need to <br className="sm:hidden" /><span className="text-indigo-600">stay on track</span>
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">
                Built for students who want clarity, not complexity. Simple tools, real results.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <Card key={f.title} className="group border-slate-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md py-0">
                  <CardContent className="p-6">
                    <div className={`mb-5 inline-flex rounded-xl ${f.bg} p-3 ${f.text} transition-transform duration-200 group-hover:scale-105`}>
                      {f.icon}
                    </div>
                    <h3 className="text-base font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="bg-white py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-14 text-center">
              <Badge variant="outline" className="rounded-full border-purple-100 bg-purple-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-purple-600">
                How It Works
              </Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
                From chaos to clarity <br className="sm:hidden" /><span className="text-indigo-600">in 4 steps</span>
              </h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {steps.map((s) => (
                <Card key={s.num} className="border-slate-100 bg-[#f7f7fb] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md py-0">
                  <CardContent className="flex h-full items-start gap-5 p-6">
                    <span className="shrink-0 select-none text-4xl font-bold text-indigo-400">{s.num}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{s.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section id="reviews" className="bg-[#f7f7fb] py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-14 text-center">
              <Badge variant="outline" className="rounded-full border-amber-100 bg-amber-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-amber-600">
                Reviews
              </Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
                Loved by <span className="text-indigo-600">real students</span>
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base text-slate-500">
                Don&apos;t take our word for it — here&apos;s what our peers have to say.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {reviews.map((r) => (
                <Card key={r.name} className="border-slate-100 bg-white shadow-sm py-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                  <CardContent className="p-8">
                    {/* Stars */}
                    <div className="mb-4 flex gap-0.5">
                      {Array.from({ length: r.stars }).map((_, i) => (
                        <svg key={i} className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
                        </svg>
                      ))}
                    </div>
                    {/* Quote */}
                    <p className="text-base leading-relaxed text-slate-700">&ldquo;{r.quote}&rdquo;</p>
                    {/* Author */}
                    <div className="mt-6 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`${r.color} text-sm font-bold text-white`}>{r.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{r.name}</p>
                        <p className="text-xs text-slate-500">{r.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-indigo-600 py-24 text-white">
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute right-1/4 top-8 h-20 w-20 rounded-full bg-amber-400/30" />
          <div className="relative mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Ready to build your best semester?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-indigo-200">
              Join students who turned scattered scrolling into focused, intentional study time.
              It&apos;s completely free to start.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button asChild size="lg" className="rounded-full bg-white px-8 text-indigo-600 hover:bg-indigo-50 shadow-lg shadow-indigo-900/20 hover:-translate-y-0.5 transition-all">
                <Link href="/login">Get started — it&apos;s free</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="rounded-full border border-white/30 bg-white/10 px-8 text-white hover:bg-white/20 hover:-translate-y-0.5 transition-all">
                <a href="#features">Explore features</a>
              </Button>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-slate-100 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
                <svg viewBox="0 0 20 20" fill="white" className="h-3.5 w-3.5">
                  <path d="M10 2a8 8 0 100 16A8 8 0 0010 2zm0 3a1 1 0 011 1v3.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 019 10V6a1 1 0 011-1z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-700">HelpImTooLazy</span>
            </div>
            <p className="text-xs text-slate-400">© 2026 HelpImTooLazy. Built with ❤️ for focused students.</p>
          </div>
        </footer>
      </main>
    </>
  );
}