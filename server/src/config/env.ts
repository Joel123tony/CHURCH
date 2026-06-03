import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().default(8080),
  USE_MOCK_DB: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  MONGODB_URI: z.string().min(1).optional(),
  JWT_ACCESS_SECRET: z.string().default("dev-access-secret"),
  JWT_REFRESH_SECRET: z.string().default("dev-refresh-secret"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  YOUTUBE_API_KEY: z.string().optional(),
  YOUTUBE_CHANNEL_ID: z.string().optional(),
  PUBLIC_WEB_URL: z.string().default("http://localhost:5173"),
  ADMIN_WEB_URL: z.string().default("http://localhost:5174"),
  API_BASE_URL: z.string().default("http://localhost:8080"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:5173,http://localhost:5174"),
  SEED_ADMIN_NAME: z.string().optional(),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(8).optional()
});

export const env = schema.parse(process.env);
export const useMockDatabase = env.USE_MOCK_DB || !env.MONGODB_URI;
