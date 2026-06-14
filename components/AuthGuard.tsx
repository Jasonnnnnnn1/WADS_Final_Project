"use client";

import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

const PROFILE_SETUP_PATH = "/profile-setup";

async function getProfileCompletionStatus(idToken: string): Promise<boolean> {
  const res = await fetch("/api/auth/session", {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to resolve auth session");
  }

  const payload = (await res.json()) as {
    success: boolean;
    data?: { profileCompleted?: boolean };
  };

  return Boolean(payload.data?.profileCompleted);
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const redirectToLogin = useCallback((reason?: string) => {
    const next = encodeURIComponent(pathname || "/dashboard");
    const reasonPart = reason ? `&reason=${encodeURIComponent(reason)}` : "";
    router.replace(`/login?next=${next}${reasonPart}`);
  }, [router, pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const run = async () => {
        if (!user) {
          redirectToLogin();
          setCheckingAuth(false);
          return;
        }

        try {
          const idToken = await user.getIdToken();
          const profileCompleted = await getProfileCompletionStatus(idToken);

          if (!profileCompleted && pathname !== PROFILE_SETUP_PATH) {
            router.replace(PROFILE_SETUP_PATH);
            return;
          }

          if (profileCompleted && pathname === PROFILE_SETUP_PATH) {
            router.replace("/dashboard");
            return;
          }
        } catch {
          redirectToLogin("session-expired");
          return;
        } finally {
          setCheckingAuth(false);
        }
      };

      void run();
    });

    return () => unsubscribe();
  }, [router, pathname, redirectToLogin]);

  if (checkingAuth) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-indigo-700 font-semibold">
          <span className="inline-block h-5 w-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          Checking session...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
