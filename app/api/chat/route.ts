import { NextRequest } from "next/server";
import { getOrCreateSession } from "@/lib/session";
import { db } from "@/config/db";
import { chatMessages, uiVersions } from "@/config/schema";
import { eq, desc } from "drizzle-orm";
import { runPipelineStreaming, type StageEvent } from "@/lib/agent/pipeline";

// 🛡️ CRITICAL FIX: Prevent Serverless Timeouts!
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send an SSE event
      function send(event: string, data: unknown) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      try {
        const body = await req.json();
        const message = body?.message;
        const currentCode = body?.currentCode || null;
        const currentPlan = body?.currentPlan || null;

        if (!message || typeof message !== "string") {
          send("error", { error: "Message is required" });
          controller.close();
          return;
        }

        const sessionId = await getOrCreateSession();

        // Save user message
        await db.insert(chatMessages).values({
          sessionId,
          role: "user",
          content: message,
        });

        // Run streaming pipeline — each stage fires an SSE event
        const onStage = (event: StageEvent) => {
          send("stage", event);
        };

        const result = await runPipelineStreaming(
          message,
          currentCode,
          currentPlan,
          onStage
        );

        // Find next version number
        const lastVersion = await db
          .select({ version: uiVersions.version })
          .from(uiVersions)
          .where(eq(uiVersions.sessionId, sessionId))
          .orderBy(desc(uiVersions.version))
          .limit(1);

        const nextVersion = (lastVersion[0]?.version ?? 0) + 1;

        // Deactivate all current versions
        await db
          .update(uiVersions)
          .set({ isActive: false })
          .where(eq(uiVersions.sessionId, sessionId));

        // Insert new version
        await db.insert(uiVersions).values({
          sessionId,
          version: nextVersion,
          code: result.code,
          plan: result.plan as any,
          explanation: result.explanation,
          isActive: true,
        });

        // Save assistant message
        await db.insert(chatMessages).values({
          sessionId,
          role: "assistant",
          content: result.explanation,
        });

        // Send final done event with all data
        send("done", {
          code: result.code,
          explanation: result.explanation,
          plan: result.plan,
          version: nextVersion,
        });

        controller.close();
      } catch (error) {
        console.error("[/api/chat] Stream error:", error);
        const payload = `event: error\ndata: ${JSON.stringify({ error: "Generation failed. Please try again." })}\n\n`;
        controller.enqueue(encoder.encode(payload));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}