const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail', // Ou outro provedor
    auth: {
        user: 'cadernetavirtual0@gmail.com',
        pass: 'sbbp dlnq yfmw bqeq ', // Gere uma senha de app no Gmail
    },
});

module.exports = transporter;