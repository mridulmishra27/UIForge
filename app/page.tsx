"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatPanel, type ChatMessage } from "@/components/app/ChatPanel";
import { ArtifactPanel } from "@/components/app/ArtifactPanel";
import { type StreamingStage, INITIAL_STAGE } from "@/lib/types";
import { VersionHistoryDropdown } from "@/components/app/VersionHistoryDropdown";

interface VersionSnapshot {
  id: number;
  version: number;
  code: string;
  plan: Record<string, unknown> | null;
  explanation: string | null;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [code, setCode] = useState<string>("");
  const [currentPlan, setCurrentPlan] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [activeVersionIdx, setActiveVersionIdx] = useState<number>(-1);
  const [artifactTitle, setArtifactTitle] = useState("UIForge");
  const [streamingStage, setStreamingStage] = useState<StreamingStage>(INITIAL_STAGE);

  // Initialize session
  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((d) => setSessionId(d.sessionId))
      .catch(console.error);
  }, []);

  const canUndo = activeVersionIdx > 0;
  const canRedo = activeVersionIdx < versions.length - 1;

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const prev = versions[activeVersionIdx - 1];
    setActiveVersionIdx((i) => i - 1);
    setCode(prev.code);
    setCurrentPlan(prev.plan);
  }, [canUndo, versions, activeVersionIdx]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const next = versions[activeVersionIdx + 1];
    setActiveVersionIdx((i) => i + 1);
    setCode(next.code);
    setCurrentPlan(next.plan);
  }, [canRedo, versions, activeVersionIdx]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!sessionId) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setStreamingStage(INITIAL_STAGE);

      // We'll collect final data from the stream
      let finalPlan: Record<string, unknown> | null = null;
      let finalCode: string | null = null;
      let finalExplanation: string | null = null;
      let finalVersion: number | null = null;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            currentCode: code || null,
            currentPlan: currentPlan,
          }),
        });

        if (!res.ok || !res.body) {
          const errData = await res.json().catch(() => ({}));
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `Error: ${(errData as Record<string, string>).error || "Request failed"}`,
              timestamp: new Date(),
            },
          ]);
          return;
        }

        // Read the SSE stream
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from the buffer
          const lines = buffer.split("\n");
          buffer = "";

          let currentEvent = "";
          let currentData = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              currentData = line.slice(6).trim();
            } else if (line === "" && currentEvent && currentData) {
              // Complete event — process it
              try {
                const data = JSON.parse(currentData);

                if (currentEvent === "stage") {
                  const stage = data.stage as keyof StreamingStage;
                  const status = data.status as "running" | "done";

                  setStreamingStage((prev) => ({ ...prev, [stage]: status }));

                  // Update state as soon as data arrives
                  if (data.plan) {
                    finalPlan = data.plan;
                    setCurrentPlan(data.plan);
                  }
                  if (data.code) {
                    finalCode = data.code;
                    setCode(data.code);
                  }
                  if (data.explanation) {
                    finalExplanation = data.explanation;
                  }
                } else if (currentEvent === "done") {
                  finalCode = data.code || finalCode;
                  finalPlan = data.plan || finalPlan;
                  finalExplanation = data.explanation || finalExplanation;
                  finalVersion = data.version || null;

                  if (data.code) setCode(data.code);
                  if (data.plan) setCurrentPlan(data.plan);
                } else if (currentEvent === "error") {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: crypto.randomUUID(),
                      role: "assistant",
                      content: `Error: ${data.error || "Generation failed"}`,
                      timestamp: new Date(),
                    },
                  ]);
                  return;
                }
              } catch {
                // Ignore malformed JSON
              }
              currentEvent = "";
              currentData = "";
            } else if (line !== "") {
              // Incomplete event, put back in buffer
              buffer += line + "\n";
            }
          }
        }

        // Extract title from first request
        if (versions.length === 0) {
          const words = content.split(" ").slice(0, 5).join(" ");
          setArtifactTitle(words.length > 30 ? words.slice(0, 30) + "..." : words);
        }

        // Track version for undo/redo
        const snapshot: VersionSnapshot = {
          id: Date.now(),
          version: finalVersion ?? versions.length + 1,
          code: finalCode || code,
          plan: finalPlan ?? currentPlan,
          explanation: finalExplanation ?? null,
        };

        setVersions((prev) => {
          const base = prev.slice(0, activeVersionIdx + 1);
          const updated = [...base, snapshot];
          setActiveVersionIdx(updated.length - 1);
          return updated;
        });

        // Assistant reply
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              finalExplanation ||
              "UI generated! Check the preview →",
            timestamp: new Date(),
            plan: finalPlan ?? null,
            code: finalCode ?? null,
          },
        ]);
      } catch (err) {
        console.error("Chat fetch error:", err);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Network error — could not reach the server.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        setStreamingStage(INITIAL_STAGE);
      }
    },
    [sessionId, code, currentPlan, versions, activeVersionIdx]
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0d0d14] overflow-hidden">
      {/* Header */}
      <header className="h-11 flex items-center justify-between px-4 border-b border-white/5 shrink-0 bg-[#111119]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
            <svg
              className="w-3.5 h-3.5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-foreground">
              {artifactTitle}
            </h1>
            {versions.length > 0 && (
              <span className="text-[10px] text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded">
                v{versions[activeVersionIdx]?.version ?? 1}
              </span>
            )}
          </div>
        </div>

        {/* Undo / Redo & History */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleUndo}
              disabled={!canUndo}
              title="Undo"
              className="text-muted-foreground hover:text-foreground disabled:opacity-20"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleRedo}
              disabled={!canRedo}
              title="Redo"
              className="text-muted-foreground hover:text-foreground disabled:opacity-20"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Version History Dropdown */}
          <VersionHistoryDropdown
            versions={versions}
            activeVersionIdx={activeVersionIdx}
            setActiveVersionIdx={setActiveVersionIdx}
            setCode={setCode}
            setCurrentPlan={setCurrentPlan}
          />
        </div>
      </header>

      {/* Two-panel layout: Chat | Artifact */}
      <div className="flex-1 min-h-0 flex">
        {/* Left — Chat */}
        <div className="w-[420px] shrink-0 h-full overflow-hidden bg-[#0a0a10]">
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            streamingStage={streamingStage}
          />
        </div>

        {/* Right — Artifact Panel (Preview / Code) */}
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          <ArtifactPanel
            code={code}
            onCodeChange={setCode}
            title={artifactTitle}
          />
        </div>
      </div>
    </div>
  );
}
