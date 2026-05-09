import { Router } from "express";
import { authRequired } from "../middlewares/auth.js";
import { getIO, sendNotificationToUser } from "../services/socket.service.js";

const router = Router();

router.use(authRequired);

router.post("/create-room", async (req, res) => {
  try {
    const { appointmentId, doctorId, patientName, duration = 30 } = req.body;
    const roomId = `video_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    const room = {
      roomId,
      appointmentId,
      doctorId,
      patientName,
      createdBy: req.user.userId,
      createdAt: new Date().toISOString(),
      duration,
      participants: [req.user.userId],
      status: "waiting",
    };

    if (doctorId) {
      const notification = {
        type: "video_call_request",
        title: "Yêu cầu gọi video",
        message: `${patientName || "Bệnh nhân"} muốn gọi video`,
        roomId,
        appointmentId,
        doctorId,
        patientId: req.user.userId,
        patientName: patientName || "Bệnh nhân",
        action: "accept_video_call",
      };

      sendNotificationToUser(doctorId, notification);
      try {
        getIO().to(`doctor:${doctorId}`).emit("video-call-request", notification);
      } catch {
        // Socket server may be unavailable in tests.
      }
    }

    return res.json({
      success: true,
      room,
      signalingServer: process.env.SIGNALING_SERVER || `http://localhost:${process.env.PORT || 5001}`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/join-room", async (req, res) => {
  try {
    const { roomId } = req.body;
    const io = getIO();

    io.to(`room:${roomId}`).emit("user-joined-room", {
      userId: req.user.userId,
      userName: req.user.name || req.user.email,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: "Joined room successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/notify-doctor", async (req, res) => {
  try {
    const { doctorId, appointmentId, patientName, roomId } = req.body;

    const notification = {
      type: "video_call_request",
      title: "Yêu cầu gọi video",
      message: `${patientName || "Bệnh nhân"} muốn gọi video`,
      roomId,
      appointmentId,
      doctorId,
      patientId: req.user.userId,
      patientName: patientName || "Bệnh nhân",
      action: "accept_video_call",
    };

    sendNotificationToUser(doctorId, notification);
    try {
      getIO().to(`doctor:${doctorId}`).emit("video-call-request", notification);
    } catch {
      // Socket server may be unavailable in tests.
    }

    return res.json({
      success: true,
      message: "Notification sent",
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/room/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    return res.json({
      success: true,
      roomId,
      status: "active",
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
