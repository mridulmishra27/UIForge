import { NextRequest, NextResponse } from "next/server";
import { getOrCreateSession } from "@/lib/session";
import { db } from "@/config/db";
import { uiVersions } from "@/config/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const versionId = parseInt(id, 10);

        if (isNaN(versionId)) {
            return NextResponse.json(
                { error: "Invalid version ID" },
                { status: 400 }
            );
        }

        const sessionId = await getOrCreateSession();

        // Find the target version
        const [target] = await db
            .select()
            .from(uiVersions)
            .where(
                and(
                    eq(uiVersions.id, versionId),
                    eq(uiVersions.sessionId, sessionId)
                )
            )
            .limit(1);

        if (!target) {
            return NextResponse.json(
                { error: "Version not found" },
                { status: 404 }
            );
        }

        // Deactivate all versions for this session
        await db
            .update(uiVersions)
            .set({ isActive: false })
            .where(eq(uiVersions.sessionId, sessionId));

        // Activate the target version
        await db
            .update(uiVersions)
            .set({ isActive: true })
            .where(eq(uiVersions.id, versionId));

        return NextResponse.json({ version: { ...target, isActive: true } });
    } catch (error) {
        console.error("[/api/versions/rollback] Error:", error);
        return NextResponse.json(
            { error: "Rollback failed" },
            { status: 500 }
        );
    }
}
