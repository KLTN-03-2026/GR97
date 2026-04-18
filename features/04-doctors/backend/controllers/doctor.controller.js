const Doctor = require('../models/Doctor');

// Get all doctors
exports.getAllDoctors = async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.status(200).json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching doctors', error });
    }
};

// Get a doctor by ID
exports.getDoctorById = async (req, res) => {
    const { id } = req.params;
    try {
        const doctor = await Doctor.findById(id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.status(200).json(doctor);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching doctor', error });
    }
};

// Create a new doctor
exports.createDoctor = async (req, res) => {
    const newDoctor = new Doctor(req.body);
    try {
        const savedDoctor = await newDoctor.save();
        res.status(201).json(savedDoctor);
    } catch (error) {
        res.status(400).json({ message: 'Error creating doctor', error });
    }
};

// Update a doctor
exports.updateDoctor = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedDoctor = await Doctor.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedDoctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.status(200).json(updatedDoctor);
    } catch (error) {
        res.status(400).json({ message: 'Error updating doctor', error });
    }
};

// Delete a doctor
exports.deleteDoctor = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedDoctor = await Doctor.findByIdAndDelete(id);
        if (!deletedDoctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.status(200).json({ message: 'Doctor deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting doctor', error });
    }
};