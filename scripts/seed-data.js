const mongoose = require('mongoose');
const Appointment = require('../features/02-appointments/backend/models/Appointment');
const Doctor = require('../features/04-doctors/backend/models/Doctor');
const MedicalRecord = require('../features/07-records/backend/models/MedicalRecord');
const User = require('../features/01-auth/backend/models/User');
const ChatMessage = require('../features/03-chat/backend/models/ChatMessage');

const seedData = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/health-system', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        await Appointment.deleteMany({});
        await Doctor.deleteMany({});
        await MedicalRecord.deleteMany({});
        await User.deleteMany({});
        await ChatMessage.deleteMany({});

        const doctors = await Doctor.insertMany([
            { name: 'Dr. John Doe', specialty: 'Cardiology' },
            { name: 'Dr. Jane Smith', specialty: 'Neurology' },
        ]);

        const appointments = await Appointment.insertMany([
            { doctor: doctors[0]._id, patient: 'Patient A', date: new Date(), status: 'scheduled' },
            { doctor: doctors[1]._id, patient: 'Patient B', date: new Date(), status: 'scheduled' },
        ]);

        const medicalRecords = await MedicalRecord.insertMany([
            { patient: 'Patient A', records: ['Record 1', 'Record 2'] },
            { patient: 'Patient B', records: ['Record 3'] },
        ]);

        const users = await User.insertMany([
            { username: 'user1', password: 'password1', role: 'patient' },
            { username: 'user2', password: 'password2', role: 'doctor' },
        ]);

        const chatMessages = await ChatMessage.insertMany([
            { sender: users[0]._id, receiver: users[1]._id, message: 'Hello, Doctor!' },
            { sender: users[1]._id, receiver: users[0]._id, message: 'Hello, Patient!' },
        ]);

        console.log('Data seeded successfully!');
    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedData();