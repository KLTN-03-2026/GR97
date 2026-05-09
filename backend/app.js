import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import compression from "compression";
import authRoutes from "./routes/auth.routes.js";
import serviceRoutes from "./routes/service.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import userRoutes from "./routes/user.routes.js";
import doctorRoutes from "./routes/doctor.routes.js";
import recordRoutes from "./routes/record.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import doctorPortalRoutes from "./routes/doctor.portal.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import videoRoutes from "./routes/video.routes.js";
import doctorChatRoutes from "./routes/doctor-chat.routes.js";
import healthRoutes from "./routes/health.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.js";

const app = express();
const corsOrigins = Array.from(
  new Set(
    [
      process.env.FRONTEND_URL,
      ...(process.env.FRONTEND_URLS || "").split(","),
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
    ]
      .map((item) => (item || "").trim())
      .filter(Boolean)
  )
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS blocked"));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(compression()); // Compress responses
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  })
);

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/doctor-portal", doctorPortalRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/doctor-chat", doctorChatRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
