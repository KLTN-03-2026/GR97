import express from 'express';
import authRoutes from '../../features/01-auth/backend/routes/auth.routes.js';
import appointmentRoutes from '../../features/02-appointments/backend/routes/appointment.routes.js';
import chatRoutes from '../../features/03-chat/backend/routes/chat.routes.js';
import doctorRoutes from '../../features/04-doctors/backend/routes/doctor.routes.js';
import adminRoutes from '../../features/05-admin/backend/routes/admin.routes.js';
import paymentRoutes from '../../features/06-payments/backend/routes/payment.routes.js';
import recordRoutes from '../../features/07-records/backend/routes/record.routes.js';
import videoRoutes from '../../features/08-video-consultation/backend/routes/video.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/chat', chatRoutes);
router.use('/doctors', doctorRoutes);
router.use('/admin', adminRoutes);
router.use('/payments', paymentRoutes);
router.use('/records', recordRoutes);
router.use('/video', videoRoutes);

export default router;