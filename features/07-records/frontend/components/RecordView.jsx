import React, { useEffect, useState } from 'react';
import { fetchRecord } from '../../lib/api';

const RecordView = ({ recordId }) => {
    const [record, setRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getRecord = async () => {
            try {
                const data = await fetchRecord(recordId);
                setRecord(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        getRecord();
    }, [recordId]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h2>Medical Record</h2>
            {record ? (
                <div>
                    <h3>{record.patientName}</h3>
                    <p><strong>Doctor:</strong> {record.doctorName}</p>
                    <p><strong>Date:</strong> {new Date(record.date).toLocaleDateString()}</p>
                    <p><strong>Details:</strong> {record.details}</p>
                </div>
            ) : (
                <p>No record found.</p>
            )}
        </div>
    );
};

export default RecordView;