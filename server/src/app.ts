import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth.routes";
import { publicRouter } from "./routes/public.routes";
import { adminRouter } from "./routes/admin.routes";
import { pagesRouter } from "./routes/pages.routes";
import { sectionsRouter } from "./routes/sections.routes";
import { pastorsRouter } from "./routes/pastors.routes";
import { eventsRouter } from "./routes/events.routes";
import { sermonsRouter } from "./routes/sermons.routes";
import { mediaRouter } from "./routes/media.routes";
import { requestsRouter } from "./routes/requests.routes";
import { youtubeRouter } from "./routes/youtube.routes";
import { analyticsRouter } from "./routes/analytics.routes";
import { errorHandler } from "./middleware/errorHandler";
import { env } from "./config/env";
import { getDatabaseStatus } from "./config/db";

const allowedOrigins = env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean);

export const app = express();

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(helmet());
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.get("/", (_req, res) => {
  res
    .type("html")
    .send(
      "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Church API</title></head><body style='font-family:Arial,sans-serif;padding:32px;line-height:1.6'><h1>Church API</h1><p>The API is running.</p><ul><li><a href='/health'>/health</a></li><li><a href='/api/public/home'>/api/public/home</a></li></ul></body></html>"
    );
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "church-api", database: getDatabaseStatus() });
});

app.use("/api/auth", authRouter);
app.use("/api/public", publicRouter);
app.use("/api/admin", adminRouter);
app.use("/api/pages", pagesRouter);
app.use("/api/sections", sectionsRouter);
app.use("/api/pastors", pastorsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/sermons", sermonsRouter);
app.use("/api/media", mediaRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/youtube", youtubeRouter);
app.use("/api/analytics", analyticsRouter);

app.use(errorHandler);
