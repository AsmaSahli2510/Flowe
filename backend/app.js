import { features } from "./routes/features.js";
import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { originGuard, requireAuth } from "./middleware/auth.js";
import authRoutes from "./routes/authRoutes.js";
import workspaceRoutes from "./routes/workspaceRoutes.js";
import invitationRoutes from "./routes/invitationRoutes.js";
import { listTemplates } from "./controllers/projectController.js";
export function createApp({ store } = {}) {
  const app = express();
  if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 240,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );
  app.use(express.json({ limit: "5mb" }));
  app.use(originGuard);
  app.locals.sessionMiddleware = session({
    name: "flowe.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store:
      store ||
      MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: "sessions",
      }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 86400000,
    },
  });
  app.use(app.locals.sessionMiddleware);
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api", features);
  app.use("/api/auth", authRoutes);
  app.use("/api/workspaces", workspaceRoutes);
  app.use("/api/invitations", invitationRoutes);
  app.get("/api/templates", requireAuth, listTemplates);
  app.use((req, res) => res.status(404).json({ message: "Route not found" }));
  app.use((error, req, res, next) => {
    const status =
      error.code === 11000
        ? 409
        : error.name === "ValidationError" || error.name === "CastError"
          ? 400
          : error.status || 500;
    if (status >= 500) console.error("API error:", error.name);
    res.status(status).json({
      message:
        status === 500
          ? "An unexpected error occurred"
          : error.code === 11000
            ? "This record already exists"
            : error.message,
    });
  });
  return app;
}
