const express = require('express');
const router = express.Router();
const School = require('../models/school.model'); // Ajuste o caminho se necessário
const { authenticateToken } = require('../utilities');

// 1. Rota que busca 1 escola por ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const school = await School.findById(req.params.id);
        if (!school) {
            return res.status(404).json({ message: 'Escola não encontrada.' });
        }
        res.status(200).json(school);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar a escola.' });
    }
});

// 2. Rota que busca todas as escolas de 1 usuário
router.get('/schools/:id', authenticateToken, async (req, res) => {
    try {
        const schools = await School.find({ userId: req.params.id }); // Assumindo que há um campo userId para associar escolas a usuários
        res.status(200).json(schools);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar as escolas.' });
    }
});

// 3. Rota que adiciona uma escola
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, email, inepCode, phone, address, cnpj, userId } = req.body;

        // Verifica se todos os campos obrigatórios estão presentes
        if (!name || !email || !inepCode || !phone || !address || !cnpj || !userId) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }

        // Cria a nova escola
        const school = new School({
            name,
            email,
            inepCode,
            phone,
            address,
            cnpj,
            userId
        });

        await school.save();
        res.status(201).json({ message: 'Escola adicionada com sucesso.', school });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao adicionar a escola.' });
    }
});

// 4. Rota que altera os dados de 1 escola
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, email, inepCode, phone, address, cnpj } = req.body;

        // Atualiza os dados da escola
        const school = await School.findByIdAndUpdate(req.params.id, {
            name,
            email,
            inepCode,
            phone,
            address,
            cnpj,
        }, { new: true }); // Retorna a versão atualizada

        if (!school) {
            return res.status(404).json({ message: 'Escola não encontrada.' });
        }

        res.status(200).json({ message: 'Escola atualizada com sucesso.', school });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar a escola.' });
    }
});

// 5. Rota que exclui uma escola
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const school = await School.findByIdAndDelete(req.params.id);

        if (!school) {
            return res.status(404).json({ message: 'Escola não encontrada.' });
        }

        res.status(200).json({ message: 'Escola excluída com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao excluir a escola.' });
    }
});

module.exports = router;