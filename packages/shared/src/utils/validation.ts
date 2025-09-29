import { z } from "zod"

export const emailSchema = z.string().email("Invalid email address")

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")

export const userSchema = z.object({
  id: z.string().uuid(),
  email: emailSchema,
  username: z.string().min(3).max(50),
  avatar_url: z.string().url().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const gameSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  min_players: z.number().min(1).max(20),
  max_players: z.number().min(1).max(20),
  duration_minutes: z.number().min(1).max(1440).optional(),
  complexity_rating: z.number().min(1).max(5).optional(),
  image_url: z.string().url().optional(),
  created_at: z.string().datetime(),
})

export const eventSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  game_id: z.string().uuid(),
  organizer_id: z.string().uuid(),
  location: z.string().min(1).max(500),
  date_time: z.string().datetime(),
  max_participants: z.number().min(1).max(100),
  current_participants: z.number().min(0),
  status: z.enum(["draft", "published", "cancelled", "completed"]),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})
