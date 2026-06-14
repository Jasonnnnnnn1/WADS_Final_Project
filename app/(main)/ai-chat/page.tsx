"use client";

import { useEffect, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { auth } from "@/lib/firebase";
import { DEFAULT_AI_SETTINGS, loadAISettings, type AISettings } from "@/lib/ai-preferences";
import { Loader2, Send, Plus, MessageCircle, Trash2, Pencil, Sparkles, Menu, ChevronLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
}

export default function AIChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameConversationId, setRenameConversationId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAiSettings(loadAISettings());

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoadingConversations(false);
        return;
      }

      try {
        const token = await user.getIdToken();
        setIdToken(token);
      } catch (error) {
        console.error("Error loading auth token:", error);
        setLoadingConversations(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const syncSettings = () => setAiSettings(loadAISettings());
    window.addEventListener("ai-settings-updated", syncSettings as EventListener);
    window.addEventListener("storage", syncSettings);
    return () => {
      window.removeEventListener("ai-settings-updated", syncSettings as EventListener);
      window.removeEventListener("storage", syncSettings);
    };
  }, []);

  useEffect(() => {
    if (idToken) {
      fetchConversations(idToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idToken]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchConversations = async (token: string) => {
    try {
      const response = await fetch("/api/ai/chat", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch conversations");
      const data = await response.json();
      setConversations(data.data || []);
      if (data.data?.length > 0 && !currentConversationId) {
        setCurrentConversationId(data.data[0].id);
        await loadConversation(data.data[0].id, token);
      } else if ((data.data?.length ?? 0) === 0) {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadConversation = async (conversationId: string, token: string) => {
    try {
      const response = await fetch(`/api/ai/chat?conversationId=${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to load conversation");
      const data = await response.json();
      const msgs = (data.data?.messages ?? []) as Array<{ role: Message["role"]; content: string; createdAt?: string }>;
      setMessages(
        msgs.map((msg) => ({
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt,
        }))
      );
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const createNewConversation = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInput("");
  };

  const sendMessage = async () => {
    if (!input.trim() || loading || !idToken) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          message: input,
          conversationId: currentConversationId,
          preferences: aiSettings,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to send message");
      }

      setCurrentConversationId(data.data.conversationId);
      const assistantMessage: Message = {
        role: "assistant",
        content: data.data.assistantMessage.content,
        createdAt: data.data.assistantMessage.createdAt,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh conversations to show latest
      await fetchConversations(idToken);
    } catch (error) {
      console.error("Error sending message:", error);
      const message = error instanceof Error ? error.message : "Sorry, I couldn't process that. Please try again.";
      setMessages((prev) =>
        prev.slice(0, -1).concat({
          role: "assistant",
          content: message,
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const confirmed = window.confirm("Delete this conversation? This cannot be undone.");
      if (!confirmed || !idToken) return;

      const response = await fetch("/api/ai/chat", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ conversationId: id }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete conversation");
      }

      if (currentConversationId === id) {
        createNewConversation();
      }
      setConversations((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const openRenameConversation = (conversation: Conversation) => {
    setRenameConversationId(conversation.id);
    setRenameValue(conversation.title);
    setRenameDialogOpen(true);
  };

  const handleRenameConversation = async () => {
    if (!renameConversationId || !idToken) return;
    const nextTitle = renameValue.trim();
    if (!nextTitle) return;

    setRenameLoading(true);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ conversationId: renameConversationId, title: nextTitle }),
      });

      if (!response.ok) throw new Error("Failed to rename conversation");

      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === renameConversationId ? { ...conversation, title: nextTitle } : conversation
        )
      );
      setRenameDialogOpen(false);
    } catch (error) {
      console.error("Error renaming conversation:", error);
    } finally {
      setRenameLoading(false);
    }
  };

  if (loadingConversations) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden bg-background relative w-full">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="absolute inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Conversations */}
      <div className={`absolute inset-y-0 left-0 z-50 w-64 transform bg-background border-r border-border transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:bg-muted/30 flex flex-col min-h-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {/* Mobile close button */}
        <div className="absolute top-1/2 -right-4 -translate-y-1/2 md:hidden z-50">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full w-8 h-8 bg-background shadow-md border-border" 
            onClick={() => setSidebarOpen(false)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-4 border-b border-border">
          <Button
            onClick={createNewConversation}
            className="w-full gap-2"
            variant="default"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1 min-h-0 h-full">
          <div className="p-2 space-y-2">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2">
                No conversations yet. Start a new chat!
              </p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-3 rounded-lg cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                    currentConversationId === conv.id
                      ? "bg-primary/20 border border-primary"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => {
                    setCurrentConversationId(conv.id);
                    if (idToken) {
                      loadConversation(conv.id, idToken);
                    }
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" title={formatConversationTitle(conv.title)}>
                      {formatConversationTitle(conv.title, 18)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        openRenameConversation(conv);
                      }}
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Sidebar Info */}
        <div className="p-4 border-t border-border text-xs text-muted-foreground space-y-2">
          <p className="font-semibold">Meet Jessalyne:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Get encouragement after completing tasks</li>
            <li>Ask how to start a task right now</li>
            <li>Ask for help adding a clear, scoped task</li>
            <li>Chat casually when you need a quick reset</li>
          </ul>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="border-b border-border p-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="md:hidden shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Jessalyne
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Your witty productivity coach, encouragement buddy, and playful chat companion
          </p>
          <p className="mt-2 inline-flex flex-wrap items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-[10px] sm:text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            {aiSettings.characterRoleplay !== "none" && (
              <>
                <span className="font-semibold text-primary/80">
                  {aiSettings.characterRoleplay
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </span>
                <span>·</span>
              </>
            )}
            <span>{aiSettings.promptStyle} tone</span>
            <span>·</span>
            <span>{aiSettings.maxResponseLength} replies</span>
            <span>·</span>
            <span>{aiSettings.studyMode} mode</span>
          </p>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 min-h-0 h-full p-2 sm:p-4">
          <div className="space-y-4 max-w-2xl pb-8 mx-auto w-full">
            {messages.length === 0 && !loading ? (
              <div className="space-y-4 pt-2">
                <Card className="max-w-2xl border-dashed bg-muted/30 p-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <MessageCircle className="h-4 w-4" />
                      Welcome to Jessalyne
                    </div>
                    <p className="text-sm leading-7 text-foreground">
                      Hi, I’m Jessalyne. I’m the one who’ll cheer you on, gently roast your procrastination, and help you turn chaos into a plan.
                      Need help starting, adding a task, celebrating a win, or just a quick funny chat? I’m here.
                    </p>
                  </div>
                </Card>
                <div className="flex flex-col items-center justify-center gap-4 text-center py-10">
                  <MessageCircle className="w-12 h-12 text-muted-foreground" />
                  <div>
                    <h2 className="text-lg font-semibold">Start a conversation!</h2>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Jessalyne can help with motivation, task-start steps, task-writing help, study strategy, or a casual chat.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((message, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <Card
                    className={`max-w-xl p-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <div className="space-y-3 text-sm leading-7 text-foreground [&_p]:m-0 [&_ul]:m-0 [&_ol]:m-0 [&_blockquote]:m-0 [&_code]:rounded [&_code]:bg-background/70 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-foreground [&_strong]:font-semibold [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:font-semibold [&_hr]:border-border [&_hr]:my-3">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                            ul: ({ children }) => <ul className="my-3 space-y-3 pl-0">{children}</ul>,
                            ol: ({ children }) => <ol className="my-3 ml-5 list-decimal space-y-2">{children}</ol>,
                            li: ({ children }) => (
                              <li className="relative pl-5 before:absolute before:left-0 before:top-0 before:text-foreground before:content-['•']">
                                {children}
                              </li>
                            ),
                            strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                            code: ({ children }) => <code className="rounded bg-background/70 px-1 py-0.5 text-[0.95em] text-foreground">{children}</code>,
                            pre: ({ children }) => <pre className="overflow-x-auto rounded-md border bg-background/70 p-3 text-sm leading-6">{children}</pre>,
                            blockquote: ({ children }) => <blockquote className="border-l-2 border-border pl-3 italic text-muted-foreground">{children}</blockquote>,
                            hr: () => <hr className="my-4 border-border" />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                    {message.createdAt && (
                      <p
                        className={`text-xs mt-2 ${
                          message.role === "user"
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </Card>
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-3">
                <Card className="bg-muted p-3">
                  <div className="flex gap-2 items-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <p className="text-sm text-muted-foreground">AI is thinking...</p>
                  </div>
                </Card>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-muted/20">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Talk to Jessalyne about tasks, motivation, or anything light..."
              disabled={loading}
              className="flex-1"
              maxLength={2000}
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-2">
            {input.length}/2000 characters
          </p>
        </div>
      </div>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              placeholder="Conversation title"
              maxLength={80}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)} disabled={renameLoading}>
              Cancel
            </Button>
            <Button onClick={handleRenameConversation} disabled={renameLoading || !renameValue.trim()}>
              {renameLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save title
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatConversationTitle(title: string, maxLength = 18) {
  const normalized = title.replace(/\s+/g, " ").trim();
  if (!normalized) return "New Conversation";

  const sentenceMatch = normalized.match(/^.+?[.!?](?=\s|$)/);
  const sentence = sentenceMatch?.[0] ?? normalized;
  const compact = collapseRepeatedWords(sentence).trim();
  const candidate = compact || normalized;

  if (candidate.length <= maxLength) {
    return candidate;
  }

  return `${candidate.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function collapseRepeatedWords(value: string) {
  let result = value;
  let previous = "";

  while (result !== previous) {
    previous = result;
    result = result.replace(/\b([\w'-]+)(\s+\1\b)+/gi, "$1");
  }

  return result;
}
