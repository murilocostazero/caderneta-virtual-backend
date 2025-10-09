const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SchoolSubjectSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    workload: {
        // Mantém o campo atual para compatibilidade
        type: Number,
        required: false // Torna opcional durante a transição
    },
    workloads: {
        elementary: {
            type: Number,
            required: true // Carga horária para Fundamental
        },
        highSchool: {
            type: Number,
            required: true // Carga horária para Médio
        }
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