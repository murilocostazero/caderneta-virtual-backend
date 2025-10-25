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
//app.use(cors({ origin: '*' }));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'Authorization'],
  credentials: false,
}));

//middleware manual para garantir que os cabeçalhos sejam aplicados mesmo em respostas de erro
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    return res.status(200).json({});
  }
  next();
});


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