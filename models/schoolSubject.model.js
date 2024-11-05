const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SchoolSubjectSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    workload: {
        type: Number, // Carga horária em horas
        required: true
    },
    school: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true
    },
    teachers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('SchoolSubject', SchoolSubjectSchema);