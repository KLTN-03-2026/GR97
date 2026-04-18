import React, { useEffect, useState } from 'react';
import AppointmentForm from '../components/AppointmentForm';
import { fetchAppointments } from '../../lib/api';

const AppointmentsPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadAppointments = async () => {
            try {
                const data = await fetchAppointments();
                setAppointments(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadAppointments();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>Appointments</h1>
            <AppointmentForm />
            <ul>
                {appointments.map(appointment => (
                    <li key={appointment.id}>
                        {appointment.date} - {appointment.time} with {appointment.doctorName}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AppointmentsPage;