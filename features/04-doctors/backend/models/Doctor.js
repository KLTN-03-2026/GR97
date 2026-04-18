import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    specialty: {
        type: String,
        required: true,
    },
    experience: {
        type: Number,
        required: true,
    },
    contact: {
        phone: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
    },
    availability: {
        type: [String],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;