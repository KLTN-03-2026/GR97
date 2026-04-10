import { Router } from "express";
import { z } from "zod";
import { authRequired } from "../middlewares/auth.js";
import {
  getHealthMetrics,
  updateHealthMetrics,
} from "../services/memoryClinic.js";
import { validateBody } from "../middlewares/validate.js";
import { User } from "../models/User.js";

const router = Router();
const useMemoryAuth = process.env.IN_MEMORY_AUTH === "1";

const healthMetricsSchema = z.object({
  heartRate: z.number().min(30).max(220),
  bloodPressure: z.string().min(3).max(20),
  glucose: z.number().min(1).max(30),
});

router.use(authRequired);

router.get("/dashboard", async (req, res, next) => {
  try {
    const userId = req.user.userId;

    if (useMemoryAuth) {
      return res.json({
        stats: { appointmentsCount: 0, upcomingCount: 0, chatCount: 0 },
        upcomingAppointment: null,
        healthMetrics: getHealthMetrics(userId),
      });
    }

    const mockStats = { appointmentsCount: 0, upcomingCount: 0, chatCount: 0 };
    return res.json({
      stats: mockStats,
      upcomingAppointment: null,
      healthMetrics: getHealthMetrics(userId),
    });
  } catch (error) {
    return next(error);
  }
});

router.patch(
  "/health-metrics",
  validateBody(healthMetricsSchema),
  async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const healthMetrics = updateHealthMetrics(userId, req.body);
      return res.json({ healthMetrics });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
