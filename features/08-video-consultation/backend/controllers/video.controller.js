import VideoConsultation from '../models/VideoConsultation';
import { createError } from '../utils/error';

export const startVideoConsultation = async (req, res, next) => {
    try {
        const { userId, doctorId } = req.body;
        const consultation = await VideoConsultation.create({ userId, doctorId });
        res.status(201).json(consultation);
    } catch (error) {
        next(createError(500, 'Failed to start video consultation'));
    }
};

export const endVideoConsultation = async (req, res, next) => {
    try {
        const { consultationId } = req.params;
        const consultation = await VideoConsultation.findByIdAndUpdate(consultationId, { ended: true }, { new: true });
        if (!consultation) {
            return next(createError(404, 'Consultation not found'));
        }
        res.status(200).json(consultation);
    } catch (error) {
        next(createError(500, 'Failed to end video consultation'));
    }
};

export const getVideoConsultationDetails = async (req, res, next) => {
    try {
        const { consultationId } = req.params;
        const consultation = await VideoConsultation.findById(consultationId);
        if (!consultation) {
            return next(createError(404, 'Consultation not found'));
        }
        res.status(200).json(consultation);
    } catch (error) {
        next(createError(500, 'Failed to retrieve consultation details'));
    }
};