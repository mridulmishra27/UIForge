import { NextResponse } from "next/server";
import { getOrCreateSession } from "@/lib/session";
import { db } from "@/config/db";
import { uiVersions } from "@/config/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
    try {
        const sessionId = await getOrCreateSession();

        const versions = await db
            .select()
            .from(uiVersions)
            .where(eq(uiVersions.sessionId, sessionId))
            .orderBy(desc(uiVersions.version));

        return NextResponse.json({ versions });
    } catch (error) {
        console.error("[/api/versions] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch versions" },
            { status: 500 }
        );
    }
}
