"use client";

import React, { useState, useCallback } from "react";
import { Copy, Check, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CodeEditorProps {
    code: string;
    onCodeChange: (code: string) => void;
}

export function CodeEditor({ code, onCodeChange }: CodeEditorProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [code]);

    // Simple line number calculation
    const lines = code.split("\n");
    const lineCount = lines.length;

    return (
        <div className="flex flex-col h-full bg-[#0d1117] text-[#e6edf3] font-mono text-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#161b22]">
                <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#7c8aff]" />
                    <span className="text-xs font-medium text-[#8b949e]">
                        Generated Code
                    </span>
                    <span className="text-xs text-[#484f58] ml-1">
                        {lineCount} lines
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={handleCopy}
                    className="text-[#8b949e] hover:text-[#e6edf3] hover:bg-white/5"
                >
                    {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                        <Copy className="w-3.5 h-3.5" />
                    )}
                </Button>
            </div>

            {/* Editor Area */}
            <ScrollArea className="flex-1 overflow-hidden">
                <div className="flex min-h-full">
                    {/* Line Numbers */}
                    <div className="flex flex-col items-end pr-4 pl-4 py-4 text-[#484f58] select-none border-r border-white/5 bg-[#0d1117] sticky left-0">
                        {lines.map((_, i) => (
                            <div key={i} className="leading-6 text-xs">
                                {i + 1}
                            </div>
                        ))}
                    </div>

                    {/* Code Content */}
                    <div className="flex-1 relative">
                        <textarea
                            value={code}
                            onChange={(e) => onCodeChange(e.target.value)}
                            className="w-full min-h-full resize-none bg-transparent p-4 text-sm leading-6 text-[#e6edf3] font-mono outline-none caret-[#7c8aff] selection:bg-[#7c8aff]/20"
                            spellCheck={false}
                            style={{
                                tabSize: 2,
                            }}
                        />
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
