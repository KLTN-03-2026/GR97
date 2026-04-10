import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { validateBody } from "../middlewares/validate.js";
import {
  createUser as createMemoryUser,
  findByCitizenId,
  findByEmail,
  findByPhone,
  mapUserResponse,
} from "../services/memoryAuth.js";
import { sendWelcomeEmail } from "../services/email.service.js";

const router = Router();
const useMemoryAuth = process.env.IN_MEMORY_AUTH === "1";

const registerSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().optional(),
  password: z.string().min(6).max(100).optional(),
  phone: z.string().min(8).max(20),
  birthDate: z.string().optional(),
  citizenId: z.string().max(32).optional().default(""),
});

router.post("/register", validateBody(registerSchema), async (req, res, next) => {
  try {
    const { fullName, email, password, phone, birthDate, citizenId } = req.body;

    const normalizedEmail = email?.toLowerCase()?.trim();
    const normalizedPhone = phone.trim();
    const normalizedCitizenId = citizenId?.trim();

    if (useMemoryAuth) {
      if (normalizedEmail && findByEmail(normalizedEmail)) {
        return res.status(409).json({ message: "Email already exists" });
      }
      if (findByPhone(normalizedPhone)) {
        return res.status(409).json({ message: "Phone already exists" });
      }
      if (normalizedCitizenId && findByCitizenId(normalizedCitizenId)) {
        return res.status(409).json({ message: "Citizen ID already exists" });
      }
    } else {
      if (normalizedEmail) {
        const emailExists = await User.findOne({ email: normalizedEmail });
        if (emailExists) {
          return res.status(409).json({ message: "Email already exists" });
        }
      }

      const phoneExists = await User.findOne({ phone: normalizedPhone });
      if (phoneExists) {
        return res.status(409).json({ message: "Phone already exists" });
      }

      if (normalizedCitizenId) {
        const citizenExists = await User.findOne({ citizenId: normalizedCitizenId });
        if (citizenExists) {
          return res.status(409).json({ message: "Citizen ID already exists" });
        }
      }
    }

    const generatedEmail =
      normalizedEmail ||
      `u${Date.now()}_${normalizedPhone.replace(/\D/g, "").slice(-8)}@healthyai.local`;
    const generatedPassword = password || `${normalizedPhone.slice(-6)}Aa!`;

    const parsedBirthDate = birthDate ? new Date(birthDate) : null;
    if (birthDate && Number.isNaN(parsedBirthDate?.getTime?.())) {
      return res.status(400).json({ message: "Invalid birthDate" });
    }

    const user = useMemoryAuth
      ? await createMemoryUser({
          fullName,
          email: generatedEmail,
          password: generatedPassword,
          phone: normalizedPhone,
          birthDate: parsedBirthDate,
          citizenId: normalizedCitizenId || "",
        })
      : await User.create({
          fullName,
          email: generatedEmail,
          password: generatedPassword,
          phone: normalizedPhone,
          birthDate: parsedBirthDate,
          citizenId: normalizedCitizenId || "",
        });

    const token = signToken({
      userId: user._id?.toString ? user._id.toString() : user._id,
      role: user.role,
    });

    const userEmail = useMemoryAuth ? user.email : user.email;
    const userFullName = useMemoryAuth ? user.fullName : user.fullName;
    sendWelcomeEmail(userEmail, userFullName).catch(err => 
      console.error("Failed to send welcome email:", err.message)
    );

    return res.status(201).json({
      token,
      generatedPassword: password ? null : generatedPassword,
      user: useMemoryAuth ? mapUserResponse(user) : {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    if (error?.name === "MongoServerError" && error?.code === 11000) {
      const duplicateField = Object.keys(error?.keyPattern || {})[0] || "field";
      return res.status(409).json({ message: `${duplicateField} already exists` });
    }
    if (error?.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    console.error("Register error:", error);
    return res.status(500).json({
      message: "Register failed. Please try again.",
      detail: process.env.NODE_ENV === "production" ? undefined : error?.message,
    });
  }
});

export default router;
