import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    suggestions: [{
      type: {
        type: String,
        enum: ["doctor", "specialty"],
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      specialty: String,
      reason: String,
    }],
  },
  { timestamps: true }
);

// Create indexes for performance
chatMessageSchema.index({ user: 1, createdAt: -1 });
chatMessageSchema.index({ role: 1 });
chatMessageSchema.index({ createdAt: -1 });

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
