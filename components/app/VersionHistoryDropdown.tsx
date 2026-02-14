"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface VersionSnapshot {
    id: number;
    version: number;
    code: string;
    plan: Record<string, unknown> | null;
    explanation: string | null;
}

interface VersionHistoryDropdownProps {
    versions: VersionSnapshot[];
    activeVersionIdx: number;
    setActiveVersionIdx: React.Dispatch<React.SetStateAction<number>>;
    setCode: React.Dispatch<React.SetStateAction<string>>;
    setCurrentPlan: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>;
}

export function VersionHistoryDropdown({
    versions,
    activeVersionIdx,
    setActiveVersionIdx,
    setCode,
    setCurrentPlan,
}: VersionHistoryDropdownProps) {
    return (
        <div className="relative group">
            <button className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded bg-muted/20 hover:bg-muted/40">
                <span>History</span>
                <ChevronDown className="w-3 h-3" />
            </button>
            {/* Dropdown Content */}
            <div className="absolute top-full right-0 mt-1 w-48 bg-[#111119] border border-border/40 rounded-lg shadow-xl overflow-hidden z-50 hidden group-hover:block transition-all">
                <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground border-b border-white/5">
                    Last 7 Versions
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                    {versions.slice(-7).reverse().map((v) => (
                        <button
                            key={v.id}
                            onClick={() => {
                                const idx = versions.findIndex(ver => ver.id === v.id);
                                if (idx !== -1) {
                                    setActiveVersionIdx(idx);
                                    setCode(v.code);
                                    setCurrentPlan(v.plan);
                                }
                            }}
                            className={cn(
                                "w-full text-left px-3 py-2 text-xs flex flex-col gap-0.5 hover:bg-white/5 transition-colors",
                                versions[activeVersionIdx]?.id === v.id ? "bg-violet-500/10 text-violet-300" : "text-foreground"
                            )}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span className="font-medium">v{v.version}</span>
                                <span className="text-[10px] opacity-50">{new Date(v.id).toLocaleTimeString()}</span>
                            </div>
                        </button>
                    ))}
                    {versions.length === 0 && (
                        <div className="px-3 py-4 text-center text-[10px] text-muted-foreground">
                            No history yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
