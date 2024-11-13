const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LessonSchema = new Schema({
    topic: String,
    date: Date,
    attendance: [{
        student: { type: Schema.Types.ObjectId, ref: 'Student' },
        present: Boolean
    }]
});

const StudentEvaluationSchema = new Schema({
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    monthlyExam: Number,
    bimonthlyExam: Number,
    qualitativeAssessment: Number,
    bimonthlyGrade: Number,
    bimonthlyRecovery: Number,
    bimonthlyAverage: Number,
    totalAbsences: Number
});

const TermSchema = new Schema({
    startDate: { type: Date, required: true }, // Data de início
    endDate: { type: Date, required: true }, // Data de término
    lessons: [LessonSchema],
    studentEvaluations: [StudentEvaluationSchema]
});

const GradebookSchema = new Schema({
    academicYear: Number,
    skill: String,
    subject: { type: Schema.Types.ObjectId, ref: 'SchoolSubject', required: true },
    classroom: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    school: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    term1: TermSchema,
    term2: TermSchema,
    term3: TermSchema,
    term4: TermSchema
}, {
    timestamps: true
});

module.exports = mongoose.model('Gradebook', GradebookSchema);