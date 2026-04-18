import authController from '../../features/01-auth/backend/controllers/auth.controller.js';
import appointmentController from '../../features/02-appointments/backend/controllers/appointment.controller.js';
import chatController from '../../features/03-chat/backend/controllers/chat.controller.js';
import doctorController from '../../features/04-doctors/backend/controllers/doctor.controller.js';
import adminController from '../../features/05-admin/backend/controllers/admin.controller.js';
import paymentController from '../../features/06-payments/backend/controllers/payment.controller.js';
import recordController from '../../features/07-records/backend/controllers/record.controller.js';
import videoController from '../../features/08-video-consultation/backend/controllers/video.controller.js';

export {
    authController,
    appointmentController,
    chatController,
    doctorController,
    adminController,
    paymentController,
    recordController,
    videoController
};