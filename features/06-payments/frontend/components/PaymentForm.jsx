import React, { useState } from 'react';
import { processPayment } from '../../lib/api';

const PaymentForm = () => {
    const [amount, setAmount] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const response = await processPayment({ amount, cardNumber, expiryDate, cvv });
            if (response.success) {
                setSuccess('Payment processed successfully!');
            } else {
                setError('Payment failed. Please try again.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Payment Form</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
            <div>
                <label>Amount:</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Card Number:</label>
                <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>Expiry Date:</label>
                <input
                    type="text"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="MM/YY"
                    required
                />
            </div>
            <div>
                <label>CVV:</label>
                <input
                    type="text"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Pay Now</button>
        </form>
    );
};

export default PaymentForm;