import React from 'react';

const DoctorCard = ({ doctor }) => {
    return (
        <div className="doctor-card">
            <img src={doctor.image} alt={`${doctor.name}'s profile`} className="doctor-image" />
            <h3 className="doctor-name">{doctor.name}</h3>
            <p className="doctor-specialty">{doctor.specialty}</p>
            <p className="doctor-experience">{doctor.experience} years of experience</p>
            <button className="view-profile-button">View Profile</button>
        </div>
    );
};

export default DoctorCard;