import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/chat";

// === TABLE DEFINITIONS ===
// We might not store full browser history in DB for this MVP, but let's have a table for bookmarked/saved pages or history logs if needed.
// For now, we'll just keep the user table from the template and maybe an 'actions' log.

export const history = pgTable("history", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  title: text("title"),
  visitTime: timestamp("visit_time").defaultNow(),
  screenshot: text("screenshot"), // Base64 or URL
});

// === EXPLICIT API CONTRACT TYPES ===

// Browser Actions
export const browserActionSchema = z.object({
  action: z.enum(["navigate", "click", "type", "scroll", "screenshot", "back", "forward", "reload", "evaluate"]),
  url: z.string().optional(),
  selector: z.string().optional(),
  text: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  script: z.string().optional(),
});

export type BrowserActionRequest = z.infer<typeof browserActionSchema>;

export const browserStateSchema = z.object({
  url: z.string(),
  title: z.string(),
  screenshot: z.string().optional(), // Base64
  html: z.string().optional(),
  isLoading: z.boolean(),
});

export type BrowserState = z.infer<typeof browserStateSchema>;

export const chatRequestSchema = z.object({
  message: z.string(),
  context: browserStateSchema.optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const chatResponseSchema = z.object({
  message: z.string(),
  action: browserActionSchema.optional(), // AI might suggest an action
});

export type ChatResponse = z.infer<typeof chatResponseSchema>;
