import mongoose from "mongoose";
import { encrypt, decrypt } from "../services/encryption.service.js";

const fileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    size: { type: String, required: true, trim: true },
    uploadedAtLabel: { type: String, default: "" },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    medicine: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    usage: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const medicalRecordSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    visitDate: { type: Date, required: true },
    hospital: { type: String, required: true, trim: true },
    doctorName: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true },
    diagnosis: { type: String, required: true, trim: true },
    summary: { type: String, default: "", trim: true },
    symptoms: [{ type: String }],
    recommendations: [{ type: String }],
    files: [fileSchema],
    prescriptions: [prescriptionSchema],
    accessLog: [{
      accessedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      accessedAt: { type: Date, default: Date.now },
      ipAddress: { type: String },
      action: { type: String }, // view, edit, download
    }],
  },
  { timestamps: true }
);

// Auto-encrypt sensitive fields before saving
medicalRecordSchema.pre("save", function (next) {
  if (this.isModified("diagnosis")) {
    this.diagnosis = encrypt(this.diagnosis);
  }
  if (this.isModified("summary")) {
    this.summary = encrypt(this.summary);
  }
  if (this.isModified("symptoms")) {
    this.symptoms = this.symptoms.map(s => encrypt(s));
  }
  if (this.isModified("recommendations")) {
    this.recommendations = this.recommendations.map(r => encrypt(r));
  }
  next();
});

// Auto-decrypt sensitive fields after fetching
medicalRecordSchema.post("find", function (docs) {
  docs.forEach(doc => {
    if (doc.diagnosis) doc.diagnosis = decrypt(doc.diagnosis);
    if (doc.summary) doc.summary = decrypt(doc.summary);
    if (doc.symptoms) doc.symptoms = doc.symptoms.map(s => decrypt(s));
    if (doc.recommendations) doc.recommendations = doc.recommendations.map(r => decrypt(r));
  });
});

medicalRecordSchema.post("findOne", function (doc) {
  if (doc) {
    if (doc.diagnosis) doc.diagnosis = decrypt(doc.diagnosis);
    if (doc.summary) doc.summary = decrypt(doc.summary);
    if (doc.symptoms) doc.symptoms = doc.symptoms.map(s => decrypt(s));
    if (doc.recommendations) doc.recommendations = doc.recommendations.map(r => decrypt(r));
  }
});

// Method to log access
medicalRecordSchema.methods.logAccess = async function (userId, ipAddress, action) {
  this.accessLog.push({
    accessedBy: userId,
    ipAddress,
    action,
  });
  await this.save();
};

export const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);
