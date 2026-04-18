import React, { useState } from 'react';
import { createAppointment } from '../../lib/api';

const AppointmentForm = () => {
    const [formData, setFormData] = useState({
        patientName: '',
        doctorId: '',
        appointmentDate: '',
        appointmentTime: '',
        notes: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createAppointment(formData);
            // Handle successful appointment creation (e.g., show a success message)
        } catch (error) {
            // Handle error (e.g., show an error message)
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>
                    Patient Name:
                    <input
                        type="text"
                        name="patientName"
                        value={formData.patientName}
                        onChange={handleChange}
                        required
                    />
                </label>
            </div>
            <div>
                <label>
                    Doctor ID:
                    <input
                        type="text"
                        name="doctorId"
                        value={formData.doctorId}
                        onChange={handleChange}
                        required
                    />
                </label>
            </div>
            <div>
                <label>
                    Appointment Date:
                    <input
                        type="date"
                        name="appointmentDate"
                        value={formData.appointmentDate}
                        onChange={handleChange}
                        required
                    />
                </label>
            </div>
            <div>
                <label>
                    Appointment Time:
                    <input
                        type="time"
                        name="appointmentTime"
                        value={formData.appointmentTime}
                        onChange={handleChange}
                        required
                    />
                </label>
            </div>
            <div>
                <label>
                    Notes:
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                    />
                </label>
            </div>
            <button type="submit">Schedule Appointment</button>
        </form>
    );
};

export default AppointmentForm;