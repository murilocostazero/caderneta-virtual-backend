const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
	name: {
		type: String,
	},
	email: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	cpf: {
        type: String,
        required: false,
        unique: false // Certifique-se de que unique está definido como false ou omitido
    },
	phone: {
		type: String,
	},
	address: {
		type: String,
	},
	areaOfExpertise: {
		type: String,
	},
	birthDate: {
		type: Date,
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	userType: {
		type: String,
		enum: ['manager', 'teacher'],
	},
	lastSelectedSchool: {
		type: Schema.Types.ObjectId,
		ref: 'School',
	},
});

module.exports = mongoose.model('User', userSchema);