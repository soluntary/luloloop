import { pgTable, uuid, varchar, text, integer, timestamp } from "drizzle-orm/pg-core"

export const games = pgTable("games", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  min_players: integer("min_players").notNull(),
  max_players: integer("max_players").notNull(),
  duration_minutes: integer("duration_minutes"),
  complexity_rating: integer("complexity_rating"),
  image_url: text("image_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
})

export type Game = typeof games.$inferSelect
export type NewGame = typeof games.$inferInsert
