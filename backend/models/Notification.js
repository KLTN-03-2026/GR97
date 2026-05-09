import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["appointment", "message", "system", "reminder", "record"],
      required: true,
    },
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    referenceType: { type: String },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Static method to send notification to user
notificationSchema.statics.send = async function (userId, notificationData) {
  const notification = new this({
    user: userId,
    ...notificationData,
  });
  
  await notification.save();
  
  // Emit realtime event via socket.io
  const { io } = await import("../services/socket.service.js");
  if (io) {
    io.to(`user:${userId}`).emit("notification", notification);
  }
  
  return notification;
};

// Static method to send bulk notification to multiple users
notificationSchema.statics.bulkSend = async function (userIds, notificationData) {
  const notifications = userIds.map(userId => ({
    user: userId,
    ...notificationData,
  }));
  
  const results = await this.insertMany(notifications);
  
  // Emit realtime events
  const { io } = await import("../services/socket.service.js");
  if (io) {
    userIds.forEach(userId => {
      io.to(`user:${userId}`).emit("notification", { user: userId, ...notificationData });
    });
  }
  
  return results;
};

export const Notification = mongoose.model("Notification", notificationSchema);
