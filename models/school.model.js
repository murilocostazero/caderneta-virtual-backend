const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schoolSchema = new Schema({
    name: {
        type: String,
        required: true, // Nome é obrigatório
    },
    email: {
        type: String,
        unique: true, // O e-mail deve ser único
    },
    phone: {
        type: String,
        required: true, // Telefone é obrigatório
    },
    inepCode: {
        type: String
    },
    address: {
        type: String,
        required: true, // Endereço é obrigatório
    },
    cnpj: {
        type: String,
        required: true, // CNPJ é obrigatório
        unique: true, // O CNPJ deve ser único
    },    
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},
    teachers: [{
		type: Schema.Types.ObjectId,
		ref: 'User',
	}],
}, { timestamps: true }); // Adiciona campos createdAt e updatedAt

module.exports = mongoose.model('School', schoolSchema);
