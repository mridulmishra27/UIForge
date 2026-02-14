import {
  integer,
  pgTable,
  varchar,
  text,
  timestamp,
  jsonb,
  boolean,
  serial,
} from "drizzle-orm/pg-core";

// Anonymous sessions — 1-day TTL, no auth required
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 64 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Chat conversation history per session
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 64 })
    .notNull()
    .references(() => sessions.sessionId, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Versioned snapshots of generated UI code
export const uiVersions = pgTable("ui_versions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 64 })
    .notNull()
    .references(() => sessions.sessionId, { onDelete: "cascade" }),
  version: integer("version").notNull(), // incrementing version number per session
  code: text("code").notNull(), // generated React JSX string
  plan: jsonb("plan"), // structured plan JSON from Planner agent
  explanation: text("explanation"), // from Explainer agent
  isActive: boolean("is_active").default(true).notNull(), // which version is currently active
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
