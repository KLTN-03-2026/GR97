import express from 'express';
import { getAdminDashboard, createAdminUser, updateAdminUser, deleteAdminUser } from '../../controllers/admin.controller';

const router = express.Router();

// Route to get admin dashboard data
router.get('/dashboard', getAdminDashboard);

// Route to create a new admin user
router.post('/users', createAdminUser);

// Route to update an existing admin user
router.put('/users/:id', updateAdminUser);

// Route to delete an admin user
router.delete('/users/:id', deleteAdminUser);

export default router;