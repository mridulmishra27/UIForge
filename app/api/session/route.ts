import { NextResponse } from "next/server";
import { getOrCreateSession } from "@/lib/session";
import { db } from "@/config/db";
import { sessions } from "@/config/schema";
import { eq } from "drizzle-orm";

export async function GET() {
    try {
        const sessionId = await getOrCreateSession();

        const session = await db
            .select()
            .from(sessions)
            .where(eq(sessions.sessionId, sessionId))
            .limit(1);

        return NextResponse.json({
            sessionId,
            createdAt: session[0]?.createdAt,
            expiresAt: session[0]?.expiresAt,
        });
    } catch (error) {
        console.error("Session error:", error);
        return NextResponse.json(
            { error: "Failed to create session" },
            { status: 500 }
        );
    }
}
