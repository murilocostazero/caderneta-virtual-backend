const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Esquema dos Campos de Experiência
const ExperienceFieldSchema = new Schema({
    name: { type: String, required: true }, // Nome do campo de experiência
    description: String, // Descrição opcional do campo
    bnccCodes: [{
        code: { type: String, required: true }, // Código BNCC (ex: EI02EF02)
        description: String // Descrição do objetivo de aprendizagem
    }],
    evaluationCriteria: [{
        label: { type: String, required: true }, // Nome do critério (ex: "Desenvolveu", "Em desenvolvimento")
        description: String // Explicação do critério
    }],
    school: { type: Schema.Types.ObjectId, ref: 'School', required: true },
}, {
    timestamps: true
});

module.exports = mongoose.model('ExperienceField', ExperienceFieldSchema);