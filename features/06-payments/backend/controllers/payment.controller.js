import PaymentService from '../services/payment.service.js';

export const createPayment = async (req, res) => {
    try {
        const paymentData = req.body;
        const payment = await PaymentService.createPayment(paymentData);
        res.status(201).json(payment);
    } catch (error) {
        res.status(500).json({ message: 'Error creating payment', error: error.message });
    }
};

export const getPayment = async (req, res) => {
    try {
        const paymentId = req.params.id;
        const payment = await PaymentService.getPaymentById(paymentId);
        if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving payment', error: error.message });
    }
};

export const updatePayment = async (req, res) => {
    try {
        const paymentId = req.params.id;
        const paymentData = req.body;
        const updatedPayment = await PaymentService.updatePayment(paymentId, paymentData);
        if (!updatedPayment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.status(200).json(updatedPayment);
    } catch (error) {
        res.status(500).json({ message: 'Error updating payment', error: error.message });
    }
};

export const deletePayment = async (req, res) => {
    try {
        const paymentId = req.params.id;
        const deletedPayment = await PaymentService.deletePayment(paymentId);
        if (!deletedPayment) {
            return res.status(404).json({ message: 'Payment not found' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting payment', error: error.message });
    }
};