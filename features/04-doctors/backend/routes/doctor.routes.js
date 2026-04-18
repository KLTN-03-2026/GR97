const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');

// Get all doctors
router.get('/', doctorController.getAllDoctors);

// Get a single doctor by ID
router.get('/:id', doctorController.getDoctorById);

// Create a new doctor
router.post('/', doctorController.createDoctor);

// Update an existing doctor
router.put('/:id', doctorController.updateDoctor);

// Delete a doctor
router.delete('/:id', doctorController.deleteDoctor);

module.exports = router;