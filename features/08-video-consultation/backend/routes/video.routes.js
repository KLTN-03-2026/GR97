import express from 'express';
import { startVideoConsultation, endVideoConsultation, getVideoConsultationDetails } from '../controllers/video.controller.js';

const router = express.Router();

// Route to start a video consultation
router.post('/start', startVideoConsultation);

// Route to end a video consultation
router.post('/end', endVideoConsultation);

// Route to get details of a video consultation
router.get('/:id', getVideoConsultationDetails);

export default router;