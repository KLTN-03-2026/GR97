import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { validateBody } from "../middlewares/validate.js";
import { authRequired } from "../middlewares/auth.js";
import crypto from "crypto";
import {
  comparePassword as compareMemoryPassword,
  findByIdentifier,
  findById as findMemoryById,
  mapUserResponse,
  generatePasswordResetToken,
  resetUserPassword,
} from "../services/memoryAuth.js";
import { sendLoginNotificationEmail } from "../services/email.service.js";

const router = Router();
const useMemoryAuth = process.env.IN_MEMORY_AUTH === "1";

const loginSchema = z.object({
  identifier: z.string().min(3).max(120),
  password: z.string().min(6).max(100),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});


router.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const normalized = identifier.trim().toLowerCase();
    const isEmail = normalized.includes("@");
    
    const user = useMemoryAuth
      ? findByIdentifier(identifier)
      : await User.findOne(
          isEmail ? { email: normalized } : { phone: identifier.trim() }
        ).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const isValid = useMemoryAuth
      ? await compareMemoryPassword(user, password)
      : await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const token = signToken({
      userId: user._id?.toString ? user._id.toString() : user._id,
      role: user.role,
    });

    const userEmail = useMemoryAuth ? user.email : user.email;
    const userFullName = useMemoryAuth ? user.fullName : user.fullName;
    const ipAddress = req.ip || req.connection?.remoteAddress || "Unknown";
    sendLoginNotificationEmail(userEmail, userFullName, new Date().toISOString(), ipAddress).catch(err =>
      console.error("Failed to send login notification:", err.message)
    );

    const userResponse = useMemoryAuth ? mapUserResponse(user) : {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
    return res.status(200).json({ token, user: userResponse });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Login failed. Please try again.",
      detail: process.env.NODE_ENV === "production" ? undefined : error?.message,
    });
  }
});

router.get("/me", authRequired, async (req, res, next) => {
  try {
    const user = useMemoryAuth
      ? findMemoryById(req.user.userId)
      : await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({
      user: useMemoryAuth ? mapUserResponse(user) : {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/refresh", authRequired, async (req, res, next) => {
  try {
    const user = useMemoryAuth
      ? findMemoryById(req.user.userId)
      : await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newToken = signToken({
      userId: user._id?.toString ? user._id.toString() : user._id,
      role: user.role,
    });

    return res.status(200).json({
      token: newToken,
      user: useMemoryAuth ? mapUserResponse(user) : {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return res.status(500).json({ message: "Failed to refresh token" });
  }
});

router.post("/forgot-password", validateBody(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    let user = null;
    let resetData = null;

    if (useMemoryAuth) {
      resetData = generatePasswordResetToken(normalizedEmail);
      if (resetData) {
        user = resetData.user;
      }
    } else {
      user = await User.findOne({ email: normalizedEmail });
      if (user) {
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); 
        
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetExpires;
        await user.save();
        
        resetData = { token: resetToken, expires: resetExpires };
      }
    }

    if (user && resetData) {
      const userEmail = useMemoryAuth ? user.email : user.email;
      const userFullName = useMemoryAuth ? user.fullName : user.fullName;
      
      const { sendPasswordResetEmail } = await import("../services/email.service.js");
      sendPasswordResetEmail(userEmail, userFullName, resetData.token).catch(err =>
        console.error("Failed to send password reset email:", err.message)
      );
    }

    return res.status(200).json({
      message: "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "An error occurred. Please try again." });
  }
});

router.post("/reset-password", validateBody(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    let user = null;

    if (useMemoryAuth) {
      const result = await resetUserPassword(token, newPassword);
      if (result.error) {
        return res.status(result.status).json({ message: result.error });
      }
      return res.status(200).json({ message: "Password has been reset successfully." });
    } else {
      user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
      });

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      user.password = newPassword;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      return res.status(200).json({ message: "Password has been reset successfully." });
    }
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "An error occurred. Please try again." });
  }
});

export default router;
