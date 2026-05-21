"use client";

import * as React from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { settingsApi } from "@/lib/api-client";

export function useUserSettings() {
  const [settings, setSettings] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(true);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      const s = await settingsApi.get();
      setSettings(s ?? null);
    } catch (err) {
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let unsub: (() => void) | null = null;
    const a = onAuthStateChanged(auth, (user) => {
      if (user) {
        reload();
      } else {
        setSettings(null);
        setLoading(false);
      }
    });
    unsub = a;
    // try an initial load in case auth is already present
    reload();
    return () => {
      if (unsub) unsub();
    };
  }, [reload]);

  return { settings, reload, loading } as const;
}
