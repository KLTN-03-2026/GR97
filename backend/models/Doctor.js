import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const doctorSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true },
    hospital: { type: String, required: true, trim: true },
    experienceYears: { type: Number, default: 5, min: 0 },
    rating: { type: Number, default: 4.6, min: 0, max: 5 },
    bio: { type: String, default: "", trim: true },
    avatarColor: { type: String, default: "#2b7edb" },
    avatarUrl: { type: String, default: "", trim: true },
    account: {
      username: { type: String, default: "", trim: true },
      email: { type: String, default: "", trim: true, lowercase: true },
      phone: { type: String, default: "", trim: true },
      isActive: { type: Boolean, default: true },
      tempPassword: { type: String, default: "", trim: true },
      updatedAt: { type: Date, default: null },
    },
    isAvailable: { type: Boolean, default: true },
    timeSlots: [{ type: String }],
  },
  { timestamps: true }
);

doctorSchema.pre("save", async function hashDoctorPassword(next) {
  const password = this.account?.tempPassword;
  if (!this.isModified("account.tempPassword") || !password || password.startsWith("$2")) {
    return next();
  }

  this.account.tempPassword = await bcrypt.hash(password, 10);
  return next();
});

export const Doctor = mongoose.model("Doctor", doctorSchema);
