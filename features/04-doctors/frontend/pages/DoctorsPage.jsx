import React, { useEffect, useState } from 'react';
import DoctorCard from '../components/DoctorCard';
import { fetchDoctors } from '../../lib/api';

const DoctorsPage = () => {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getDoctors = async () => {
            try {
                const data = await fetchDoctors();
                setDoctors(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        getDoctors();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>Doctors List</h1>
            <div className="doctors-container">
                {doctors.map(doctor => (
                    <DoctorCard key={doctor.id} doctor={doctor} />
                ))}
            </div>
        </div>
    );
};

export default DoctorsPage;