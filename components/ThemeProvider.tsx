"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { settingsApi } from "@/lib/api-client";

export default function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}<SettingsBootstrap /></NextThemesProvider>;
}

function SettingsBootstrap() {
  const { setTheme } = useTheme();

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const s = await settingsApi.get();
        if (!mounted || !s) return;
        // Apply theme if present
        const theme = s.appearanceSettings?.theme;
        if (typeof theme === "string") setTheme(theme);

        // Reduced motion
        const reduced = Boolean(s.appearanceSettings?.reducedMotion === true);
        if (reduced) {
          document.documentElement.classList.add("reduced-motion");
        } else {
          document.documentElement.classList.remove("reduced-motion");
        }
      } catch (err) {
        // ignore — settings may not exist or user not signed in yet
      }
    }
    load();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTheme]);

  return null;
}