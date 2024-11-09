const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StudentSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    cpf: {
        type: String,
        unique: true,
        sparse: true, // Isso permite que cpf seja único, mas permite valores nulos
        trim: true
    },
    birthDate: {
        type: Date,
        required: true
    },
    contact: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    guardian: {
        name: {
            type: String,
            required: true,
            trim: true
        },
        contact: {
            type: String,
            required: true,
            trim: true
        },
        relationship: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            required: true,
            trim: true
        }
    },
    classroom: {
        type: Schema.Types.ObjectId,
        ref: 'Classroom',
        required: true
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

module.exports = mongoose.model('Student', StudentSchema);