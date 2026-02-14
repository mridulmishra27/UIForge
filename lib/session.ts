import { cookies } from "next/headers";
import { eq, and, gt } from "drizzle-orm";
import { db } from "@/config/db";
import { sessions } from "@/config/schema";

const COOKIE_NAME = "blueprint_session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

/**
 * Get the current session or create a new one.
 * Sets an httpOnly cookie with a 1-day TTL.
 * Returns the sessionId string.
 */
export async function getOrCreateSession(): Promise<string> {
    const cookieStore = await cookies();
    const existingId = cookieStore.get(COOKIE_NAME)?.value;

    // If cookie exists, check if session is still valid in DB
    if (existingId) {
        const existing = await db
            .select()
            .from(sessions)
            .where(
                and(
                    eq(sessions.sessionId, existingId),
                    gt(sessions.expiresAt, new Date())
                )
            )
            .limit(1);

        if (existing.length > 0) {
            return existingId;
        }
    }

    // Create a new session
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);

    await db.insert(sessions).values({
        sessionId,
        createdAt: now,
        expiresAt,
    });

    cookieStore.set(COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_TTL_MS / 1000, // maxAge is in seconds
        path: "/",
    });

    return sessionId;
}

/**
 * Get the current session ID from the cookie without creating a new one.
 * Returns null if no valid session exists.
 */
export async function getSession(): Promise<string | null> {
    const cookieStore = await cookies();
    const existingId = cookieStore.get(COOKIE_NAME)?.value;

    if (!existingId) return null;

    // Validate session is still alive in DB
    const existing = await db
        .select()
        .from(sessions)
        .where(
            and(
                eq(sessions.sessionId, existingId),
                gt(sessions.expiresAt, new Date())
            )
        )
        .limit(1);

    return existing.length > 0 ? existingId : null;
}
