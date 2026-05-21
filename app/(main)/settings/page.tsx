"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileSettings from "@/components/ProfileSettings";
import AISettingsPanel from "@/components/AISettingsPanel";
import NotificationsSettings from "@/components/NotificationsSettings";
import SecuritySettings from "@/components/SecuritySettings";
import { BrainCircuit, Settings, Shield, User } from "lucide-react";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams?.get("tab") ?? "profile";

  return (
    <main className="flex-1 flex flex-col h-full bg-muted/5 overflow-y-auto w-full">
      <header className="px-8 py-8 border-b bg-background">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and AI preferences.</p>
      </header>

      <div className="p-4 lg:p-8 max-w-5xl mx-auto w-full">
        <Tabs defaultValue={defaultTab} orientation="vertical" className="flex flex-col lg:flex-row gap-4 lg:gap-8 w-full">
          
          {/* Left-side Navigation for Settings */}
          <TabsList variant="line" className="flex flex-row lg:flex-col h-auto bg-transparent w-full lg:w-52 items-start justify-start p-0 overflow-x-auto gap-1 lg:gap-0 lg:space-y-2 shrink-0 border-b lg:border-b-0 pb-2 lg:pb-0">
            <TabsTrigger value="profile" className="shrink-0 lg:w-full justify-start gap-2 data-[state=active]:bg-muted/50 data-[state=active]:shadow-none px-3 lg:px-4 py-2">
              <User className="w-4 h-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="ai" className="shrink-0 lg:w-full justify-start gap-2 data-[state=active]:bg-muted/50 data-[state=active]:shadow-none px-3 lg:px-4 py-2">
              <BrainCircuit className="w-4 h-4" /> AI Auto-Plan
            </TabsTrigger>
            <TabsTrigger value="preferences" className="shrink-0 lg:w-full justify-start gap-2 data-[state=active]:bg-muted/50 data-[state=active]:shadow-none px-3 lg:px-4 py-2">
              <Settings className="w-4 h-4" /> Preferences
            </TabsTrigger>
            <TabsTrigger value="security" className="shrink-0 lg:w-full justify-start gap-2 data-[state=active]:bg-muted/50 data-[state=active]:shadow-none px-3 lg:px-4 py-2">
              <Shield className="w-4 h-4" /> Security
            </TabsTrigger>
          </TabsList>

          {/* Right-side Content Panels */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <TabsContent value="profile" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <Card className="shadow-sm border-muted">
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  <CardDescription>Update your personal details.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ProfileSettings />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <AISettingsPanel />
            </TabsContent>

            <TabsContent value="preferences" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <Card className="shadow-sm border-muted">
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>Notification, calendar, focus timer, privacy, and appearance preferences.</CardDescription>
                </CardHeader>
                <CardContent className="!p-0 border-t">
                  <NotificationsSettings />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="m-0 focus-visible:outline-none focus-visible:ring-0">
              <Card className="shadow-sm border-muted">
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                  <CardDescription>Manage sign-in safety and account protection settings.</CardDescription>
                </CardHeader>
                <CardContent>
                  <SecuritySettings />
                </CardContent>
              </Card>
            </TabsContent>
            
          </div>
        </Tabs>
      </div>
    </main>
  );
}