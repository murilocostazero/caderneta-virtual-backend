const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/user.model');
const School = require('../models/school.model');
const { authenticateToken } = require('../utilities');
const router = express.Router();
const transporter = require('../mailer');

// Rota principal
router.get('/', (req, res) => {
    res.json({ data: 'Olá mundo!' });
});

router.post('/create-account', async (req, res) => {
    try {
        const { name, email, password, userType } = req.body;

        if (!name || !email || !password || !userType) {
            return res.status(400).json({ message: 'Email, senha e área de formação são obrigatórios.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'E-mail já está em uso.' });
        }

        // Hash da senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = new User({
            name,
            email,
            password: hashedPassword, // salva a senha criptografada
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

    if (!email || !password) {
        return res.status(400).json({ err: true, message: 'Email e senha são obrigatórios.' });
    }

    const userInfo = await User.findOne({ email });
    if (!userInfo) {
        return res.status(400).json({ message: 'Usuário não encontrado' });
    }

    const storedPassword = userInfo.password;

    let isPasswordValid = false;

    if (storedPassword.startsWith('$2')) {
        // Já é um hash bcrypt
        isPasswordValid = await bcrypt.compare(password, storedPassword);
    } else {
        // Ainda não é um hash, comparar direto (risco, mas necessário)
        isPasswordValid = password === storedPassword;

        if (isPasswordValid) {
            // Atualiza para hash no login
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            userInfo.password = hashedPassword;
            await userInfo.save();
        }
    }

    if (!isPasswordValid) {
        return res.status(401).json({ error: true, message: 'Credenciais inválidas' });
    }

    const accessToken = jwt.sign({ user: userInfo }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '36000m'
    });

    return res.json({
        error: false,
        message: 'Login completo',
        email,
        accessToken
    });
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

router.get('/get-user/:id', authenticateToken, async (req, res) => {
    const user = await User.findOne({ _id: req.params.id });
    if (!user) {
        return res.sendStatus(401);
    }

    return res.json({
        user: user,
        message: ''
    });
});

// Rota para buscar todos os professores
router.get('/get-team/:schoolId', authenticateToken, async (req, res) => {
    try {
        const team = await User.find({ lastSelectedSchool: req.params.schoolId })
        .sort({ 'name': 1 });

        res.status(200).json(team);
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

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Tenta encontrar e deletar o usuário
        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        res.status(200).json({ message: 'Usuário excluído com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao excluir usuário.' });
    }
});

// Rota para remover um professor do array de professores de uma escola
router.put('/remove-teacher/:schoolId/:teacherId', async (req, res) => {
    try {
        const { schoolId, teacherId } = req.params;

        // Encontra a escola pelo ID e remove o professor do array de teachers
        const school = await School.findByIdAndUpdate(
            schoolId,
            { $pull: { teachers: teacherId } }, // Usa $pull para remover o professor
            { new: true }
        );

        if (!school) {
            return res.status(404).json({ message: 'Escola não encontrada.' });
        }

        res.status(200).json({ message: 'Professor removido com sucesso.', school });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao remover professor da escola.' });
    }
});

// Rota para adicionar um novo usuário
router.post('/', authenticateToken, async (req, res) => {
    const {
        name,
        email,
        password,
        cpf,
        phone,
        address,
        areaOfExpertise,
        birthDate,
        userType,
        lastSelectedSchool
    } = req.body;

    try {
        // Cria uma nova instância do usuário
        const newUser = new User({
            name,
            email,
            password,
            cpf,
            phone,
            address,
            areaOfExpertise,
            birthDate,
            userType,
            lastSelectedSchool,
        });

        // Salva no banco de dados
        await newUser.save();

        // Se o usuário for professor, adicioná-lo à lista de professores da escola
        if (userType === 'teacher' && lastSelectedSchool) {
            await School.findByIdAndUpdate(lastSelectedSchool, {
                $addToSet: { teachers: newUser._id }
            });
        }

        return res.status(201).json({ message: 'Usuário criado com sucesso!', user: newUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao criar usuário.' });
    }
});

// Rota para atualizar um usuário existente
router.put('/:id', authenticateToken, async (req, res) => {
    const userId = req.params.id;
    const {
        name,
        email,
        password,
        cpf,
        phone,
        address,
        areaOfExpertise,
        birthDate,
        userType,
        lastSelectedSchool,
    } = req.body;

    try {
        // Busca e atualiza o usuário
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                name,
                email,
                password,
                cpf,
                phone,
                address,
                areaOfExpertise,
                birthDate,
                userType,
                lastSelectedSchool,
            },
            { new: true } // Retorna o documento atualizado
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        return res.status(200).json({ message: 'Usuário atualizado com sucesso!', user: updatedUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

        const token = crypto.randomBytes(32).toString('hex');
        const expiration = Date.now() + 3600000; // 1 hora

        user.resetPasswordToken = token;
        user.resetPasswordExpires = expiration;
        await user.save();

        const resetLink = `https://cadernetavirtual-phggv.ondigitalocean.app/reset-password?token=${token}`;

        await transporter.sendMail({
            from: '"Caderneta Virtual" <cadernetavirtual0@gmail.com>',
            to: user.email,
            subject: 'Redefinição de senha',
            html: `
                <h3>Olá, ${user.name || 'usuário'}!</h3>
                <p>Você solicitou uma redefinição de senha. Clique no link abaixo para criar uma nova senha:</p>
                <a href="${resetLink}">Redefinir senha</a>
                <p>Este link expira em 1 hora.</p>
            `
        });

        res.status(200).json({ message: 'Link enviado para o e-mail cadastrado' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao enviar e-mail' });
    }
});

router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) return res.status(400).json({ message: 'Token inválido ou expirado' });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Senha redefinida com sucesso' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao redefinir a senha' });
    }
});

module.exports = router;