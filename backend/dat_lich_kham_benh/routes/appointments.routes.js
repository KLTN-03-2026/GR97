import { Router } from "express";
import { authRequired } from "../middlewares/auth.js";
import { listAppointmentsByUser } from "../services/memoryClinic.js";
import { Appointment } from "../models/Appointment.js";

const router = Router();
const useMemoryAuth = process.env.IN_MEMORY_AUTH === "1";

// GET /api/appointments/me
router.get("/me", authRequired, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    if (useMemoryAuth) {
      const list = listAppointmentsByUser(userId);
      return res.json({ appointments: list });
    }

    const appointments = await Appointment.find({ user: userId }).sort({ appointmentAt: -1 }).populate(["doctor","service"]);
    return res.json({ appointments });
  } catch (error) {
    return next(error);
  }
});

export default router;
