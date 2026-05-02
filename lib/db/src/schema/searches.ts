import { pgTable, text, serial, timestamp, integer, jsonb, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const searchSourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
  credibilityScore: z.number(),
  domain: z.string(),
  publishedDate: z.string().nullable().optional(),
});

export type SearchSource = z.infer<typeof searchSourceSchema>;

export const searchesTable = pgTable("searches", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  title: text("title"),
  mode: text("mode").notNull().default("deep"),
  synthesis: text("synthesis").notNull().default(""),
  sources: jsonb("sources").notNull().default([]).$type<SearchSource[]>(),
  followUps: jsonb("follow_ups").notNull().default([]).$type<string[]>(),
  relatedQueries: jsonb("related_queries").notNull().default([]).$type<string[]>(),
  duration: integer("duration").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSearchSchema = createInsertSchema(searchesTable).omit({ id: true, createdAt: true });
export type InsertSearch = z.infer<typeof insertSearchSchema>;
export type Search = typeof searchesTable.$inferSelect;
