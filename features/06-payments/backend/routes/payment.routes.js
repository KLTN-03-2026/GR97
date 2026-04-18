const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');

// Route to create a new payment
router.post('/', paymentController.createPayment);

// Route to retrieve all payments
router.get('/', paymentController.getAllPayments);

// Route to retrieve a specific payment by ID
router.get('/:id', paymentController.getPaymentById);

// Route to update a payment by ID
router.put('/:id', paymentController.updatePayment);

// Route to delete a payment by ID
router.delete('/:id', paymentController.deletePayment);

module.exports = router;