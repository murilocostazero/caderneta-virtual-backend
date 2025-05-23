const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AttendanceSchema = new mongoose.Schema({
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    present: { type: Boolean, default: true },
});

const LessonSchema = new Schema({
    topic: String,
    date: Date,
    workload: {
        type: Number,
        required: false,
        min: 1
    },
    attendance: [AttendanceSchema]
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

const CoordinatorApprovalSchema = new Schema({
    approved: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    comments: { type: String }
});

const TermSchema = new Schema({
    name: { type: String },
    startDate: { type: Date, required: true }, // Data de início
    endDate: { type: Date, required: true }, // Data de término
    lessons: [LessonSchema],
    studentEvaluations: [StudentEvaluationSchema],
    coordinatorApproval: CoordinatorApprovalSchema
});

const GradebookSchema = new Schema({
    academicYear: Number,
    skill: String,
    subject: { type: Schema.Types.ObjectId, ref: 'SchoolSubject', required: true },
    classroom: { type: Schema.Types.ObjectId, ref: 'Classroom', required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    school: { type: Schema.Types.ObjectId, ref: 'School', required: true },
    terms: [TermSchema]
}, {
    timestamps: true
});

module.exports = mongoose.model('Gradebook', GradebookSchema);