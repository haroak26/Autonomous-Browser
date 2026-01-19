import { db } from "./db";
import { history, type InsertMessage, type Message } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

// Export the chat storage interface compatible with the integration
export interface IChatStorage {
  // ... methods from integration ...
  // We can just implement the basic ones needed or use the integration's storage if we imported it.
  // But since I overwrote schema.ts to export chat models, I should make sure I implement storage correctly if I'm not using the integration's storage file directly.
  // Actually, the integration provided `server/replit_integrations/chat/storage.ts`. I should probably use that or extend it.
  // For simplicity in `server/storage.ts`, I'll define the specific storage needs for the browser history.
  addToHistory(entry: typeof history.$inferInsert): Promise<typeof history.$inferSelect>;
  getHistory(): Promise<(typeof history.$inferSelect)[]>;
}

export class DatabaseStorage implements IChatStorage {
  async addToHistory(entry: typeof history.$inferInsert) {
    const [inserted] = await db.insert(history).values(entry).returning();
    return inserted;
  }

  async getHistory() {
    return db.select().from(history).orderBy(desc(history.visitTime));
  }
}

export const storage = new DatabaseStorage();
