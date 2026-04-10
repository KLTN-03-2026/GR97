import { Router } from "express";
import { authRequired } from "../middlewares/auth.js";
import { getUserDashboard as getMemoryDashboard, getHealthMetrics, updateHealthMetrics } from "../services/memoryClinic.js";
import { User } from "../models/User.js";
import { Appointment } from "../models/Appointment.js";

const router = Router();
const useMemoryAuth = process.env.IN_MEMORY_AUTH === "1";

// GET /api/users/dashboard
router.get("/dashboard", authRequired, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    if (useMemoryAuth) {
      const dashboard = getMemoryDashboard(userId);
      return res.json(dashboard);
    }

    // MongoDB: build dashboard
    const appointments = await Appointment.find({ user: userId }).sort({ appointmentAt: -1 }).limit(100);
    const upcoming = appointments.find(a => new Date(a.appointmentAt) > new Date() && ["pending","confirmed"].includes(a.status)) || null;
    const stats = {
      appointmentsCount: appointments.length,
      upcomingCount: appointments.filter(a => new Date(a.appointmentAt) > new Date() && ["pending","confirmed"].includes(a.status)).length,
      chatCount: 0,
    };

    const user = await User.findById(userId).select("healthMetrics");
    const healthMetrics = user?.healthMetrics || null;

    return res.json({ stats, upcomingAppointment: upcoming, healthMetrics });
  } catch (error) {
    return next(error);
  }
});

// PATCH /api/users/health-metrics
router.patch("/health-metrics", authRequired, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { heartRate, bloodPressure, glucose } = req.body || {};

    if (useMemoryAuth) {
      const updated = updateHealthMetrics(userId, { heartRate, bloodPressure, glucose });
      return res.json({ healthMetrics: updated });
    }

    // Persist to User.healthMetrics
    const glucoseVal = Number.isFinite(Number(glucose)) ? Number(glucose) : null;
    const next = {
      heartRate: Number.isFinite(Number(heartRate)) ? Number(heartRate) : undefined,
      bloodPressure: bloodPressure?.toString?.() || undefined,
      glucose: glucoseVal ?? undefined,
    };

    // Simple glucoseStatus computation
    let glucoseStatus = undefined;
    if (Number.isFinite(next.glucose)) {
      if (next.glucose < 3.9) glucoseStatus = "Thấp";
      else if (next.glucose <= 7.8) glucoseStatus = "Bình thường";
      else glucoseStatus = "Cần theo dõi";
    }

    const updatePayload = {
      $set: {
        "healthMetrics.heartRate": next.heartRate,
        "healthMetrics.bloodPressure": next.bloodPressure,
        "healthMetrics.glucose": next.glucose,
        "healthMetrics.glucoseStatus": glucoseStatus,
      },
    };

    await User.updateOne({ _id: userId }, updatePayload);
    const updatedUser = await User.findById(userId).select("healthMetrics");
    return res.json({ healthMetrics: updatedUser?.healthMetrics || null });
  } catch (error) {
    return next(error);
  }
});

export default router;
