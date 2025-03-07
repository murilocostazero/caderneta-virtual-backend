const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClassroomSchema = new Schema({
    classroomType: {
        type: String,
        enum: ['kindergarten', 'elementary', 'high'],
        require: true
    },
    grade: {
        type: String, // Ex: "8º ano"
        required: true,
        trim: true
    },
    name: {
        type: String, // Nome da turma, ex: "Turma A", "Turma B"
        trim: true
    },
    shift: {
        type: String, // Turno: "Matutino", "Vespertino"
        enum: ['Matutino', 'Vespertino'],
        required: true
    },
    totalStudents: {
        type: Number,
        default: 0 // Inicializa com 0 alunos
    },
    school: {
        type: Schema.Types.ObjectId,
        ref: 'School', // Referência para a escola a qual a turma pertence
        required: true
    },
    students: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
}, {
    timestamps: true // Cria automaticamente os campos createdAt e updatedAt
});

module.exports = mongoose.model('Classroom', ClassroomSchema);
