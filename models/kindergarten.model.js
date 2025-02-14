const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Esquema de Presença
const AttendanceSchema = new mongoose.Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    present: { type: Boolean, default: true },
});

// Esquema de Aula
const LessonSchema = new Schema({
    topic: String, // Tema da aula (relacionado ao campo de experiência)
    date: Date,
    attendance: [AttendanceSchema]
});

// Esquema de Avaliação por Campo de Experiência
const EvaluationSchema = new Schema({
    fieldName: { type: String, required: true }, // Nome do campo de experiência
    evaluationCriteria: {
        type: String,
        enum: ['developed', 'under-development', 'not-yet'],
        required: true
    }
});

// Esquema de Avaliação por Aluno
const StudentEvaluationSchema = new Schema({
    student: {
        _id: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
        name: { type: String, required: true },
        cpf: { type: String, required: true }
    },
    evaluations: [EvaluationSchema], // Lista de avaliações do aluno
    totalAbsences: { type: Number, default: 0 } // Total de faltas no bimestre
});

// Esquema de Período (Bimestre, Trimestre, Semestre)
const TermSchema = new Schema({
    name: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    lessons: [LessonSchema], // Aulas ministradas
    studentEvaluations: [StudentEvaluationSchema] // Avaliações qualitativas
});

// Esquema do Diário Infantil (Kindergarten)
const KindergartenGradebookSchema = new Schema({
    academicYear: Number,
    classroom: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    school: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    terms: [TermSchema] // Períodos letivos (Ex: Bimestres)
}, {
    timestamps: true
});

module.exports = mongoose.model('KindergartenGradebook', KindergartenGradebookSchema);