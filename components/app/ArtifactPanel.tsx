"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
    Eye,
    Code2,
    RefreshCw,
    Copy,
    Check,
} from "lucide-react";
import { LiveProvider, LiveEditor, LivePreview, LiveError } from "react-live";
import { Button as UIButton } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Button, Card, Row, Input, Table, Modal, Navbar, Sidebar, Chart } from "@/components/uikit";
import { themes } from "prism-react-renderer";

interface ArtifactPanelProps {
    code: string;
    onCodeChange: (code: string) => void;
    title: string;
}

// Scope for the LiveProvider
const scope = {
    React,
    useState,
    Button,
    Card,
    Row,
    Input,
    Table,
    Modal,
    Navbar,
    Sidebar,
    Chart,
    // Add lucide icons if needed, or other utils
};


export function ArtifactPanel({ code, onCodeChange, title }: ArtifactPanelProps) {
    const [view, setView] = useState<"preview" | "code">("preview");
    const [copied, setCopied] = useState(false);
    const [liveCode, setLiveCode] = useState(code);
    const [refreshKey, setRefreshKey] = useState(0);

    // Sync external code changes (from AI) to local live code
    useEffect(() => {
        setLiveCode(code);
    }, [code]);

    const handleCopy = useCallback(async () => {
        await navigator.clipboard.writeText(liveCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [liveCode]);

    // When user edits in the LiveEditor, update both local and parent state
    const handleCodeChange = useCallback(
        (newCode: string) => {
            setLiveCode(newCode);
            onCodeChange(newCode);
        },
        [onCodeChange]
    );

    // Default placeholder if no code
    const displayCode = liveCode || `
// Example:
const App = () => {
  return (
    <Card title="Welcome">
      <Row>
        <Button label="Click Me" onClick={() => alert('Hello!')} />
        <Input placeholder="Type something..." />
      </Row>
    </Card>
  );
};
render(<App />);
`.trim();

    return (
        <div className="flex flex-col h-full bg-[#0d0d14] border-l border-border/30">
            {/* Header Bar */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 bg-[#111119] shrink-0">
                {/* Left — View toggle */}
                <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5">
                    <button
                        onClick={() => setView("preview")}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                            view === "preview"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                    </button>
                    <button
                        onClick={() => setView("code")}
                        className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                            view === "code"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Code2 className="w-3.5 h-3.5" />
                        Code
                    </button>
                </div>

                {/* Right — Actions */}
                <div className="flex items-center gap-1">
                    <UIButton
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                            setLiveCode(code);
                            onCodeChange(code);
                            setRefreshKey((k) => k + 1);
                        }}
                        title="Reload preview"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </UIButton>
                    <UIButton
                        variant="ghost"
                        size="icon-xs"
                        onClick={handleCopy}
                        title="Copy code"
                        className="text-muted-foreground hover:text-foreground"
                    >
                        {copied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                            <Copy className="w-3.5 h-3.5" />
                        )}
                    </UIButton>
                </div>
            </div>

            {/* Content — react-live powered */}
            <div className="flex-1 min-h-0 overflow-hidden">
                <LiveProvider
                    key={refreshKey}
                    code={displayCode}
                    noInline={true}
                    scope={scope}
                    theme={themes.vsDark}
                >
                    {view === "preview" ? (
                        <div className="h-full flex flex-col relative isolate">
                            {/* Live Preview - Scoped for fixed positioning */}
                            <div className="flex-1 min-h-0 relative w-full h-full bg-[#0a0a10] rounded-md overflow-hidden ring-1 ring-border/20">
                                {/* The transform creates a new containing block for fixed children */}
                                <div className="absolute inset-0 transform scale-[1]">
                                    <ScrollArea className="h-full w-full">
                                        <div className="p-6 min-h-full">
                                            <LivePreview />
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                            {/* Error display */}
                            <div className="shrink-0 bg-red-500/10 border-t border-red-500/20 z-10">
                                <LiveError className="px-4 py-2 text-xs text-red-400 font-mono whitespace-pre-wrap" />
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            {/* Editable Code */}
                            <div
                                className="flex-1 overflow-auto relative"
                                spellCheck={false}
                                autoCorrect="off"
                                autoCapitalize="off"
                            >
                                <div className="absolute inset-0">
                                    <LiveEditor
                                        onChange={handleCodeChange}
                                        className="!min-h-full !bg-[#0d1117] !font-mono !text-sm"
                                        style={{
                                            minHeight: "100%",
                                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                        }}
                                    />
                                </div>
                            </div>
                            {/* Error display */}
                            <div className="shrink-0 bg-red-500/10 border-t border-red-500/20">
                                <LiveError className="px-4 py-2 text-xs text-red-400 font-mono whitespace-pre-wrap" />
                            </div>
                        </div>
                    )}
                </LiveProvider>
            </div>
        </div>
    );
}

