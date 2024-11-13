const express = require('express');
const router = express.Router();
const Gradebook = require('../models/gradebook.model');
const { authenticateToken } = require('../utilities'); 

// 1. Rota que busca um gradebook por ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const gradebook = await Gradebook.findById(req.params.id);
        if (!gradebook) {
            return res.status(404).json({ message: "Gradebook not found" });
        }
        res.json(gradebook);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Rota que busca todos os gradebooks de um teacher
router.get('/teacher/:teacherId', authenticateToken, async (req, res) => {
    try {
        const gradebooks = await Gradebook.find({ teacher: req.params.teacherId });
        res.json(gradebooks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// 3. Rota que busca todos os gradebooks de uma escola
router.get('/school/:schoolId', authenticateToken, async (req, res) => {
    try {
        const gradebooks = await Gradebook.find({ school: req.params.schoolId })
            .populate('teacher', 'name') // Preenche o campo 'professor' com o nome do professor
            .populate('subject', 'name')   // Preenche o campo 'subject' com o nome da matéria
            .populate('classroom', 'grade name shift') // Preenche o campo 'classroom' com o nome da turma
            .populate('school', '_id')  // Opcional, preenche o campo 'school' com o ID da escola (se necessário)
            .sort({ 'classroom.grade': 1, 'classroom.name': 1 });

        res.status(200).json(gradebooks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. Rota que adiciona um novo gradebook
router.post('/', authenticateToken, async (req, res) => {
    const { year, school, classroom, teacher, subject } = req.body;

    const newGradebook = new Gradebook({
        year,
        school,
        classroom,
        teacher,
        subject
    });

    try {
        const savedGradebook = await newGradebook.save();
        res.status(201).json(savedGradebook);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 5. Rota que altera os dados do gradebook
router.put('/:id', authenticateToken, async (req, res) => {
    const { year, skill, school, classroom, teacher, subject } = req.body;

    try {
        const updatedGradebook = await Gradebook.findByIdAndUpdate(
            req.params.id,
            { year, skill, school, classroom, teacher, subject },
            { new: true }
        );
        if (!updatedGradebook) {
            return res.status(404).json({ message: "Gradebook not found" });
        }
        res.json(updatedGradebook);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;