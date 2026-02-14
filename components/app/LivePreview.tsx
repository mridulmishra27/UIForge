"use client";

import React, { useState } from "react";
import { RefreshCw, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LivePreviewProps {
    code: string;
}

export function LivePreview({ code }: LivePreviewProps) {
    const [refreshKey, setRefreshKey] = useState(0);

    const previewHtml = React.useMemo(() => {
        if (!code) return "";

        return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            background: 'hsl(224 71% 4%)',
            foreground: 'hsl(213 31% 91%)',
            card: 'hsl(224 71% 4%)',
            'card-foreground': 'hsl(213 31% 91%)',
            primary: 'hsl(210 40% 98%)',
            'primary-foreground': 'hsl(222.2 47.4% 1.2%)',
            secondary: 'hsl(222.2 47.4% 11.2%)',
            'secondary-foreground': 'hsl(210 40% 98%)',
            muted: 'hsl(223 47% 11%)',
            'muted-foreground': 'hsl(215.4 16.3% 56.9%)',
            accent: 'hsl(216 34% 17%)',
            'accent-foreground': 'hsl(210 40% 98%)',
            destructive: 'hsl(0 63% 31%)',
            border: 'hsl(216 34% 17%)',
            input: 'hsl(216 34% 17%)',
            ring: 'hsl(224 64% 33%)',
          },
          borderRadius: {
            lg: '0.5rem',
            md: 'calc(0.5rem - 2px)',
            sm: 'calc(0.5rem - 4px)',
          },
        },
      },
    }
  <\/script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 16px;
      background: hsl(224 71% 4%);
      color: hsl(213 31% 91%);
    }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
    }, [code]);

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80 animate-pulse" />
                    <span className="text-xs font-medium text-muted-foreground">
                        Live Preview
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setRefreshKey((k) => k + 1)}
                    title="Reload preview"
                    className="text-muted-foreground hover:text-foreground"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                </Button>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-auto bg-[#0a0a0f] flex items-start justify-center p-4">
                {!code ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted/30 border border-border/30 mb-4">
                            <Monitor className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Your generated UI will appear here
                        </p>
                    </div>
                ) : (
                    <div
                        className="bg-[#0a0e1a] rounded-lg border border-white/5 overflow-hidden shadow-2xl w-full h-full"
                    >
                        <iframe
                            key={refreshKey}
                            srcDoc={previewHtml}
                            className="w-full h-full border-0"
                            sandbox="allow-scripts"
                            title="UI Preview"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
