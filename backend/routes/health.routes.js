import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (req, res) => {
  const inMemoryMode = process.env.IN_MEMORY_AUTH === "1";
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    uptime: process.uptime(),
    database: inMemoryMode
      ? "in-memory"
      : mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: "MB"
    }
  };

  const statusCode = health.database === "connected" || inMemoryMode ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
