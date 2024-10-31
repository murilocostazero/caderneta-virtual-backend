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
	schoolId: {
		type: Schema.Types.ObjectId,
		ref: 'School',
	},
	userType: {
		type: String,
		enum: ['manager', 'teacher'],
	}
});

module.exports = mongoose.model('User', userSchema);