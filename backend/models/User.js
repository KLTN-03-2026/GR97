import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    birthDate: {
      type: Date,
      default: null,
    },
    citizenId: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },
    specialty: {
      type: String,
      default: "",
      trim: true,
    },
    hospital: {
      type: String,
      default: "",
      trim: true,
    },
    doctorLicense: {
      type: String,
      default: "",
      trim: true,
    },
    rating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    notificationPrefs: {
      appointmentReminders: { type: Boolean, default: true },
      labResults: { type: Boolean, default: true },
      healthNews: { type: Boolean, default: false },
    },
    privacyPrefs: {
      shareRecords: { type: Boolean, default: true },
      hideContactInDocs: { type: Boolean, default: true },
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Create indexes for performance (email is already indexed by unique: true)
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ specialty: 1 });
userSchema.index({ hospital: 1 });
userSchema.index({ resetPasswordExpires: 1 }, { expireAfterSeconds: 0 });

export const User = mongoose.model("User", userSchema);
