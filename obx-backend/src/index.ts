import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { authRoutes } from "./routes/auth";
import { interviewRoutes } from "./routes/interview";
import { outputRoutes } from "./routes/output";
import { kanbanRoutes } from "./routes/kanban";
import { adminRoutes } from "./routes/admin";
import { userRoutes } from "./routes/user";
import { templateRoutes } from "./routes/templates";
import type { Env } from "./types/env";

const app = new Hono<{ Bindings: Env }>();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowed = [
        "http://localhost:3000",
        "https://obx-studio.pages.dev",
      ];
      return allowed.includes(origin) ? origin : allowed[0];
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.get("/health", (c) => c.json({ ok: true, ts: Date.now() }));

app.route("/auth", authRoutes);
app.route("/interview", interviewRoutes);
app.route("/output", outputRoutes);
app.route("/kanban", kanbanRoutes);
app.route("/admin", adminRoutes);
app.route("/user", userRoutes);
app.route("/templates", templateRoutes);

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
