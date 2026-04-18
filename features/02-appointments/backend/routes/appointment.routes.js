import express from 'express';
import { createAppointment, getAppointments, updateAppointment, deleteAppointment } from '../controllers/appointment.controller.js';

const router = express.Router();

// Route to create a new appointment
router.post('/', createAppointment);

// Route to get all appointments
router.get('/', getAppointments);

// Route to update an existing appointment
router.put('/:id', updateAppointment);

// Route to delete an appointment
router.delete('/:id', deleteAppointment);

export default router;