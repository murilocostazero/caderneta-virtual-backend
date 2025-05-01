require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');

// Conectar ao banco de dados
mongoose.connect(process.env.DB_CONFIG, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Conectado ao MongoDB'))
.catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Criar a aplicação express
const app = express();

// Middlewares
app.use(express.json());
app.use(cors({ origin: '*' }));

// Importar as rotas
const userRoute = require('./routes/user.route');
const schoolRoute = require('./routes/school.route');
const schoolSubject = require('./routes/schoolSubject.route');
const classroom = require('./routes/classroom.route');
const student = require('./routes/student.route');
const gradebook = require('./routes/gradebook.route');
const kindergarten = require('./routes/kindergarten.route');
const experienceField = require('./routes/experienceField.route');

// Usar as rotas
app.use('/', userRoute);
app.use('/school', schoolRoute);
app.use('/subject', schoolSubject);
app.use('/classroom', classroom);
app.use('/student', student);
app.use('/gradebook', gradebook);
app.use('/kindergarten', kindergarten);
app.use('/experience-field', experienceField);

// Servir arquivos estáticos do React
app.use(express.static(path.join(__dirname, 'client/build')));

// Rota wildcard para o React (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Iniciar o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;