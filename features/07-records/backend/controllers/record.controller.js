const MedicalRecord = require('../../../../features/07-records/backend/models/MedicalRecord');

// Create a new medical record
exports.createRecord = async (req, res) => {
    try {
        const record = new MedicalRecord(req.body);
        await record.save();
        res.status(201).json(record);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get all medical records
exports.getAllRecords = async (req, res) => {
    try {
        const records = await MedicalRecord.find();
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a medical record by ID
exports.getRecordById = async (req, res) => {
    try {
        const record = await MedicalRecord.findById(req.params.id);
        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.status(200).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a medical record by ID
exports.updateRecord = async (req, res) => {
    try {
        const record = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.status(200).json(record);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete a medical record by ID
exports.deleteRecord = async (req, res) => {
    try {
        const record = await MedicalRecord.findByIdAndDelete(req.params.id);
        if (!record) {
            return res.status(404).json({ message: 'Record not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};