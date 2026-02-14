"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Send,
    Sparkles,
    Loader2,
    Bot,
    User,
    ChevronDown,
    ChevronRight,
    Code2,
    ListChecks,
    Check,
    Circle,
} from "lucide-react";
import type { StreamingStage } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    plan?: Record<string, unknown> | null;
    code?: string | null;
}

interface ChatPanelProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
    streamingStage?: StreamingStage;
}

function formatComponentTree(
    components: Array<Record<string, unknown>>,
    depth: number = 0
): React.ReactNode[] {
    const nodes: React.ReactNode[] = [];
    for (const comp of components) {
        const indent = "  ".repeat(depth);
        const type = comp.type as string || "Unknown";
        const props = comp.props as Record<string, unknown> | undefined;

        // Build a short props summary
        let propsHint = "";
        if (props) {
            const keys = Object.keys(props);
            if (keys.length > 0) {
                const hints = keys.map((k) => {
                    const v = props[k];
                    if (typeof v === "string") return `${k}="${v}"`;
                    if (Array.isArray(v)) return `${k}: ${v.length} items`;
                    return k;
                });
                propsHint = ` (${hints.join(", ")})`;
            }
        }

        nodes.push(
            <div key={`${depth}-${type}-${nodes.length}`} className="text-xs text-muted-foreground leading-relaxed">
                {indent}{depth > 0 ? "└ " : "📦 "}<span className="text-violet-300 font-medium">{type}</span>
                <span className="text-muted-foreground/60">{propsHint}</span>
            </div>
        );

        // Recurse into children
        const children = comp.children as Array<Record<string, unknown>> | undefined;
        if (children && Array.isArray(children)) {
            nodes.push(...formatComponentTree(children, depth + 1));
        }
    }
    return nodes;
}

function PlanBlock({ plan }: { plan: Record<string, unknown> }) {
    const [open, setOpen] = useState(false);

    const action = (plan.action as string) || "unknown";
    const description = (plan.description as string) || "";
    const components = plan.components as Array<Record<string, unknown>> | undefined;
    const changes = plan.changes as Array<Record<string, unknown>> | undefined;
    const isCreate = action === "create";

    return (
        <div className="mt-2 rounded-lg border border-violet-500/20 bg-violet-500/5 overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-violet-400 hover:bg-violet-500/10 transition-colors"
            >
                <ListChecks className="w-3.5 h-3.5" />
                <span>Implementation Plan</span>
                {open ? (
                    <ChevronDown className="w-3 h-3 ml-auto" />
                ) : (
                    <ChevronRight className="w-3 h-3 ml-auto" />
                )}
            </button>
            {open && (
                <div className="px-3 pb-3 max-h-60 overflow-auto space-y-2">
                    {/* Action badge + description */}
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                            isCreate
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/20 text-amber-400"
                        )}>
                            {isCreate ? "✨ New Build" : "✏️ Modify"}
                        </span>
                    </div>
                    {description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                    )}

                    {/* Component tree for "create" actions */}
                    {isCreate && components && components.length > 0 && (
                        <div className="mt-1 pl-1 border-l-2 border-violet-500/20 ml-1">
                            <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-semibold mb-1">Component Tree</p>
                            {formatComponentTree(components)}
                        </div>
                    )}

                    {/* Change list for "modify" actions */}
                    {!isCreate && changes && changes.length > 0 && (
                        <div className="mt-1 space-y-1">
                            <p className="text-[10px] text-muted-foreground/70 uppercase tracking-wider font-semibold">Changes</p>
                            {changes.map((change, i) => {
                                const changeType = (change.type as string) || "update";
                                const target = (change.target as string) || (change.component as string) || "";
                                const note = (change.note as string) || (change.location as string) || "";
                                const icon = changeType === "add" ? "➕" : changeType === "remove" ? "🗑️" : "🔄";
                                return (
                                    <div key={i} className="text-xs text-muted-foreground leading-relaxed">
                                        {icon} <span className="font-medium text-foreground/80">{changeType.toUpperCase()}</span>
                                        {target && <> — <span className="text-violet-300">{target}</span></>}
                                        {note && <span className="text-muted-foreground/60 italic"> ({note})</span>}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function CodeBlock({ code }: { code: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
                <Code2 className="w-3.5 h-3.5" />
                <span>Generated Code</span>
                {open ? (
                    <ChevronDown className="w-3 h-3 ml-auto" />
                ) : (
                    <ChevronRight className="w-3 h-3 ml-auto" />
                )}
            </button>
            {open && (
                <div className="px-3 pb-3 max-h-72 overflow-auto">
                    <pre className="text-[11px] text-[#e6edf3] whitespace-pre-wrap font-mono">
                        {code}
                    </pre>
                </div>
            )}
        </div>
    );
}

const STAGE_LABELS: { key: keyof StreamingStage; label: string; icon: string }[] = [
    { key: "intent", label: "Analyzing intent", icon: "🔍" },
    { key: "planning", label: "Planning UI structure", icon: "📋" },
    { key: "generating", label: "Generating code", icon: "⚙️" },
    { key: "explaining", label: "Writing explanation", icon: "💬" },
];

function StageIndicator({ status }: { status: "pending" | "running" | "done" }) {
    if (status === "done") return <Check className="w-3.5 h-3.5 text-emerald-400" />;
    if (status === "running") return <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />;
    return <Circle className="w-3.5 h-3.5 text-muted-foreground/30" />;
}

export function ChatPanel({
    messages,
    onSendMessage,
    isLoading,
    streamingStage,
}: ChatPanelProps) {
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height =
                Math.min(textareaRef.current.scrollHeight, 150) + "px";
        }
    }, [input]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSendMessage(input.trim());
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                    <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 className="text-sm font-semibold text-foreground">
                        UIForge
                    </h2>
                    <p className="text-xs text-muted-foreground">
                        Describe your UI in plain English
                    </p>
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 overflow-hidden" ref={scrollRef}>
                <div className="flex flex-col gap-1 p-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-600/10 border border-violet-500/20">
                                <Sparkles className="w-8 h-8 text-violet-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">
                                What would you like to build?
                            </h3>
                            <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">
                                Describe a UI and I&apos;ll show the plan, generate the
                                code, and render a live preview.
                            </p>
                        </div>
                    )}

                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex gap-3 py-3 px-3 rounded-xl transition-colors",
                                msg.role === "assistant" && "bg-muted/40"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex items-center justify-center w-7 h-7 rounded-lg shrink-0 mt-0.5",
                                    msg.role === "user"
                                        ? "bg-foreground/10"
                                        : "bg-gradient-to-br from-violet-500 to-indigo-600"
                                )}
                            >
                                {msg.role === "user" ? (
                                    <User className="w-3.5 h-3.5 text-foreground" />
                                ) : (
                                    <Bot className="w-3.5 h-3.5 text-white" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                    {msg.role === "user" ? "You" : "UIForge"}
                                </p>
                                <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                                    {msg.content}
                                </div>
                                {/* Inline plan block */}
                                {msg.plan && <PlanBlock plan={msg.plan} />}
                                {/* Inline code block */}
                                {msg.code && <CodeBlock code={msg.code} />}
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3 py-3 px-3 rounded-xl bg-muted/40">
                            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 shrink-0 mt-0.5">
                                <Bot className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-muted-foreground mb-2">UIForge</p>
                                {streamingStage ? (
                                    <div className="space-y-1.5">
                                        {STAGE_LABELS.map(({ key, label, icon }) => {
                                            const status = streamingStage[key];
                                            if (status === "pending") return null;
                                            return (
                                                <div
                                                    key={key as string}
                           className={cn(
                                                        "flex items-center gap-2 text-xs transition-all",
                                                        status === "done" ? "text-muted-foreground/60" : "text-foreground"
                                                    )}
                                                >
                                                    <StageIndicator status={status} />
                                                    <span>{icon} {label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                                        <span className="text-sm text-muted-foreground">Generating UI...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-3 border-t border-border/50 shrink-0">
                <form onSubmit={handleSubmit} className="relative">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe a UI to generate..."
                        rows={1}
                        disabled={isLoading}
                        className="w-full resize-none max-h-[150px] overflow-y-auto scrollbar-hide rounded-xl border border-border/50 bg-muted/30 px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all"
                    />
                    <Button
                        type="submit"
                        size="icon-sm"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-1.5 bottom-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-30"
                    >
                        {isLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Send className="w-3.5 h-3.5" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}