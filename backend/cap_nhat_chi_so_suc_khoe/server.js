import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import { errorHandler } from "./middlewares/error.js";

const PORT = process.env.PORT || 5000;
const app = express();
const corsOrigins = Array.from(
  new Set(
    [
      process.env.FRONTEND_URL,
      ...(process.env.FRONTEND_URLS || "").split(","),
      "http://localhost:5173",
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
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use(errorHandler);

const start = async () => {
  try {
    if (process.env.IN_MEMORY_AUTH !== "1") {
      await connectDB();
    } else {
      console.log("IN_MEMORY_AUTH=1, skip MongoDB connection");
    }

    app.listen(PORT, () => {
      console.log(`Health Metrics Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

start();
