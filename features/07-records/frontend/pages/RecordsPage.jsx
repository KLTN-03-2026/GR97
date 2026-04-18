import React, { useEffect, useState } from 'react';
import RecordView from '../components/RecordView';
import { fetchRecords } from '../../lib/api';

const RecordsPage = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getRecords = async () => {
            try {
                const data = await fetchRecords();
                setRecords(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        getRecords();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>Medical Records</h1>
            {records.length > 0 ? (
                records.map(record => (
                    <RecordView key={record.id} record={record} />
                ))
            ) : (
                <p>No records found.</p>
            )}
        </div>
    );
};

export default RecordsPage;