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

// ==================== MIDDLEWARE DE FIX DE ENCODING ====================
// Função recursiva para corrigir encoding de strings
const fixEncoding = (obj) => {
  if (typeof obj === 'string') {
    // Tenta corrigir se vier com encoding quebrado
    try {
      // Caso 1: Tentar decodificar UTF-8 corrompido
      let fixed = decodeURIComponent(escape(obj));
      // Caso 2: Se ainda tiver caracteres estranhos, tenta outra abordagem
      if (fixed.match(/[ÃÀÁÂÄÇÈÉÊËÌÍÎÏÑÒÓÔÖÙÚÛÜàáâäçèéêëìíîïñòóôöùúûü]/i)) {
        fixed = Buffer.from(obj, 'latin1').toString('utf8');
      }
      return fixed;
    } catch (e) {
      return obj;
    }
  } else if (Array.isArray(obj)) {
    return obj.map(fixEncoding);
  } else if (obj && typeof obj === 'object' && obj !== null) {
    // Evita processar objetos especiais como Date, ObjectId, etc.
    if (obj.constructor && obj.constructor.name !== 'Object') {
      return obj;
    }
    const newObj = {};
    Object.keys(obj).forEach(key => {
      newObj[key] = fixEncoding(obj[key]);
    });
    return newObj;
  }
  return obj;
};

// Middleware para forçar UTF-8 nas requisições
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object' && req.body !== null) {
    req.body = fixEncoding(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = fixEncoding(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = fixEncoding(req.params);
  }
  next();
});
// ==================== FIM DO MIDDLEWARE DE ENCODING ====================

// Middlewares padrão - IMPORTANTE: usar json com limite e verificar encoding
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb', parameterLimit: 10000 }));

// Middleware para forçar UTF-8 nas respostas
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Accept-Charset', 'UTF-8');
  next();
});

// CORS configurado
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept-Charset'],
  exposedHeaders: ['Content-Length', 'Authorization'],
  credentials: false,
}));

// Middleware manual para garantir que os cabeçalhos sejam aplicados mesmo em respostas de erro
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Accept-Charset'
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    return res.status(200).json({});
  }
  next();
});

// ==================== MIDDLEWARE DE LOG PARA DEBUG (OPCIONAL) ====================
// Descomente esta parte se precisar debuggar o encoding
/*
app.use((req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        console.log('\n=== DEBUG ENCODING ===');
        console.log('Method:', req.method);
        console.log('URL:', req.url);
        console.log('Content-Type:', req.headers['content-type']);
        if (req.body) {
            console.log('Body (primeiros 200 chars):', JSON.stringify(req.body).substring(0, 200));
        }
        console.log('=====================\n');
    }
    next();
});
*/
// ==================== FIM DO MIDDLEWARE DE DEBUG ====================

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
  console.log('UTF-8 encoding middleware ativado');
});

module.exports = app;