// This file exports functions for handling admin-related requests.

const Admin = require('../../models/Admin'); // Assuming there's an Admin model
const User = require('../../models/User'); // Assuming there's a User model

// Get all admins
exports.getAllAdmins = async (req, res) => {
    try {
        const admins = await Admin.find();
        res.status(200).json(admins);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving admins', error });
    }
};

// Create a new admin
exports.createAdmin = async (req, res) => {
    const newAdmin = new Admin(req.body);
    try {
        const savedAdmin = await newAdmin.save();
        res.status(201).json(savedAdmin);
    } catch (error) {
        res.status(400).json({ message: 'Error creating admin', error });
    }
};

// Update an admin
exports.updateAdmin = async (req, res) => {
    try {
        const updatedAdmin = await Admin.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(updatedAdmin);
    } catch (error) {
        res.status(400).json({ message: 'Error updating admin', error });
    }
};

// Delete an admin
exports.deleteAdmin = async (req, res) => {
    try {
        await Admin.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting admin', error });
    }
};