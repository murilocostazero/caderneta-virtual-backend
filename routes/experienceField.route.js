const express = require('express');
const router = express.Router();
const ExperienceField = require('../models/experienceField.model');
const {authenticateToken} = require('../utilities'); // Middleware de autenticação

// 1. Buscar um campo de experiência por ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const experience = await ExperienceField.findById(req.params.id);
        if (!experience) {
            return res.status(404).json({ message: "Experience field not found" });
        }
        res.status(200).json(experience);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Adicionar um novo campo de experiência
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description, bnccCodes, evaluationCriteria, school } = req.body;
        const newExperience = new ExperienceField({
            name,
            description,
            bnccCodes,
            evaluationCriteria,
            school
        });
        await newExperience.save();
        res.status(201).json(newExperience);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. Alterar um campo de experiência por ID
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, description, bnccCodes, evaluationCriteria } = req.body;

        const updatedExperience = await ExperienceField.findByIdAndUpdate(
            req.params.id,
            { name, description, bnccCodes, evaluationCriteria },
            { new: true } // Retorna o objeto atualizado
        );
        if (!updatedExperience) {
            return res.status(404).json({ message: "Experience field not found" });
        }
        res.status(200).json(updatedExperience);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. Remover um campo de experiência por ID
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const deletedExperience = await ExperienceField.findByIdAndDelete(req.params.id);
        if (!deletedExperience) {
            return res.status(404).json({ message: "Experience field not found" });
        }
        res.status(200).json({ message: "Experience field deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 5. Buscar todos os campos de experiência de uma escola
router.get('/school/:schoolId', authenticateToken, async (req, res) => {
    try {
        const experiences = await ExperienceField.find({ school: req.params.schoolId });
        res.status(200).json(experiences);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
