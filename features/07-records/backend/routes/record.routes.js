import express from 'express';
import { getAllRecords, getRecordById, createRecord, updateRecord, deleteRecord } from '../controllers/record.controller.js';

const router = express.Router();

// Route to get all medical records
router.get('/', getAllRecords);

// Route to get a specific medical record by ID
router.get('/:id', getRecordById);

// Route to create a new medical record
router.post('/', createRecord);

// Route to update an existing medical record
router.put('/:id', updateRecord);

// Route to delete a medical record
router.delete('/:id', deleteRecord);

export default router;