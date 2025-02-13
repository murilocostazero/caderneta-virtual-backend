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

// Esquema de Avaliação Infantil (qualitativa)
const KindergartenEvaluationSchema = new Schema({
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    fieldOfExperience: { type: String, required: true }, // Ex: "Escuta, fala, pensamento e imaginação"
    bnccCode: { type: String, required: true }, // Ex: "EI02EF02"
    status: { 
        type: String, 
        enum: ['developed', 'under-development', 'not-yet'], 
        required: true 
    },
    observations: String, // Comentário do professor sobre o desenvolvimento da criança
});

// Esquema de Período (Bimestre, Trimestre, Semestre)
const TermSchema = new Schema({
    name: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    lessons: [LessonSchema], // Aulas ministradas
    studentEvaluations: [KindergartenEvaluationSchema] // Avaliações qualitativas
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