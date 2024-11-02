const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { authenticateToken } = require('../utilities');
const router = express.Router();

// Rota principal
router.get('/', (req, res) => {
    res.json({ data: 'Olá mundo!' });
});

// Rota para criação de conta
router.post('/create-account', async (req, res) => {
    try {
        const { name, email, password, userType } = req.body;

        // Verifica se todos os campos obrigatórios estão presentes
        if (!name || !email || !password || !userType) {
            return res.status(400).json({ message: 'Email, senha e área de formação são obrigatórios.' });
        }

        // Verifica se o e-mail já está em uso
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'E-mail já está em uso.' });
        }

        // Cria o novo usuário
        const user = new User({
            name,
            email,
            password, // Certifique-se de hashear a senha antes de salvar
            userType,
        });

        await user.save();

        const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '36000m'
        });

        return res.status(200).json({
            error: false,
            user,
            accessToken,
            message: 'Cadastro completo'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar conta.' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
        return res.status(400).json({ err: true, message: 'Email é um campo obrigatório' });
    }

    if (!password) {
        return res.status(400).json({ err: true, message: 'Senha é um campo obrigatório' });
    }

    const userInfo = await User.findOne({ email: email });

    if (!userInfo) {
        return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    try {
        if (userInfo.email == email && userInfo.password == password) {
            const user = { user: userInfo };
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '36000m'
            });
    
            return res.json({
                error: false,
                message: 'Login completo',
                email,
                accessToken
            });
        } else {
            return res.json({
                error: true,
                message: 'Credenciais inválidas'
            });
        }
    } catch (error){
        console.log('Login Error: ',error)
    }
});

router.get('/get-user', authenticateToken, async (req, res) => {
    const { user } = req.user;

    const isUser = await User.findOne({ _id: user._id });
    if (!isUser) {
        return res.sendStatus(401);
    }

    return res.json({
        user: isUser,
        message: ''
    });
});

// Rota para buscar todos os professores
router.get('/get-teachers', authenticateToken, async (req, res) => {
    try {
        // Busca todos os usuários com userType 'teacher'
        const teachers = await User.find({ userType: 'teacher' });
        res.status(200).json(teachers);
    } catch (error) {
        console.error('Erro ao buscar professores:', error);
        res.status(500).json({ message: 'Erro ao buscar professores' });
    }
});

router.put('/complete-profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id; // ID do usuário autenticado
        const { name, cpf, phone, address, birthDate, schoolId, userType } = req.body;

        // Verifica se todos os campos obrigatórios estão presentes
        if (!name || !cpf || !phone || !address || !birthDate || !schoolId || !userType) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios para completar o perfil.' });
        }

        // Atualiza o usuário com os novos dados
        const user = await User.findByIdAndUpdate(
            userId,
            { name, cpf, phone, address, birthDate, schoolId, userType },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.status(200).json({ message: 'Perfil atualizado com sucesso.', user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar perfil.' });
    }
});

// Rota PUT para atualizar o campo lastSelectedSchool
router.put('/update-last-school/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.id;
        const { schoolId } = req.body;

        // Verifica se o schoolId foi fornecido
        if (!schoolId) {
            return res.status(400).json({ message: 'O campo schoolId é obrigatório.' });
        }

        // Atualiza o campo lastSelectedSchool do usuário
        const user = await User.findByIdAndUpdate(
            userId,
            { lastSelectedSchool: schoolId },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.status(200).json({ message: 'Escola selecionada com sucesso.', user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar a escola selecionada.' });
    }
});



module.exports = router;