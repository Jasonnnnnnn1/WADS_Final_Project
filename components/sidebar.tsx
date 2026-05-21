"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LayoutDashboard, Calendar as CalendarIcon, ListTodo, Timer, 
    Plus, Moon, Sun, BrainCircuit, LogOut, Settings, MessageCircle
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes"; 
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getAiPlanEnabled, setAiPlanEnabled, subscribeAiPlanEnabled } from "@/lib/ai-plan-toggle";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [aiPlanEnabled, setAiPlanEnabledState] = useState<boolean>(() => getAiPlanEnabled());
  // 2. Initialize the hook
  const { theme, setTheme } = useTheme(); 

  useEffect(() => {
    const unsubscribe = subscribeAiPlanEnabled(setAiPlanEnabledState);
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut(auth);
      router.replace('/login');
    } catch (err: unknown) {
      console.error(err);
      setLoggingOut(false);
    }
  };

  return (
    <aside className="w-64 border-r bg-muted/10 hidden md:flex flex-col h-full">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">H</div>
        <h1 className="text-xl font-bold tracking-tight">HelpImTooLazy</h1>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-1 mb-6">
          <Button
            variant={pathname === '/dashboard' ? 'secondary' : 'ghost'}
            className="w-full justify-start font-semibold"
            onClick={() => router.push('/dashboard')}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </Button>

          <Button
            variant={pathname === '/calendar' ? 'secondary' : 'ghost'}
            className="w-full justify-start font-semibold"
            onClick={() => router.push('/calendar')}
          >
            <CalendarIcon className="mr-2 h-4 w-4" /> Calendar
          </Button>

          <Button
            variant={pathname === '/ai-plan' ? 'secondary' : 'ghost'}
            className="w-full justify-start font-semibold"
            onClick={() => router.push('/ai-plan')}
          >
            <BrainCircuit className="mr-2 h-4 w-4" /> AI Plan
          </Button>

          <Button
            variant={pathname === '/activities' ? 'secondary' : 'ghost'}
            className="w-full justify-start font-semibold"
            onClick={() => router.push('/activities')}
          >
            <ListTodo className="mr-2 h-4 w-4" /> Activities
          </Button>

          <Button
            variant={pathname === '/focus-timer' ? 'secondary' : 'ghost'}
            className="w-full justify-start font-semibold"
            onClick={() => router.push('/focus-timer')}
          >
            <Timer className="mr-2 h-4 w-4" /> Focus Timer
          </Button>

          <Button
            variant={pathname === '/ai-chat' ? 'secondary' : 'ghost'}
            className="w-full justify-start font-semibold"
            onClick={() => router.push('/ai-chat')}
          >
            <MessageCircle className="mr-2 h-4 w-4" /> AI Chat
          </Button>
        </div>

        <Separator className="mb-6" />

        <div className="space-y-2">
          <Button
            className="w-full justify-start shadow-sm"
            variant="default"
            onClick={() => router.push('/activities?new=1')}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Task
          </Button>

          <Button
            className="w-full justify-start shadow-none"
            variant={aiPlanEnabled ? "default" : "secondary"}
            onClick={() => setAiPlanEnabled(!aiPlanEnabled)}
          >
            <BrainCircuit className="mr-2 h-4 w-4" /> {aiPlanEnabled ? "Disable AI Auto-Plan" : "Enable AI Auto-Plan"}
          </Button>
        </div>
      </ScrollArea>

      <div className="p-4 mt-auto">
        <Separator className="mb-4" />
        
        {/* Added Settings Button Here */}
        <Button 
          variant={pathname?.startsWith('/settings') ? 'secondary' : 'ghost'} 
          className="w-full justify-start text-muted-foreground mb-1"
          onClick={() => router.push('/settings')}
        >
          <Settings className="mr-2 h-4 w-4" /> Settings
        </Button>

        {/* compact sidebar: single Settings entry only */}

        {/* 3. The Toggle Button */}
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? (
            <>
              <Sun className="mr-2 h-4 w-4" /> Light Mode
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" /> Dark Mode
            </>
          )}
        </Button>
        
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout} disabled={loggingOut}>
          <LogOut className="mr-2 h-4 w-4" /> {loggingOut ? 'Signing Out...' : 'Log Out'}
        </Button>
      </div>
    </aside>
  );
}