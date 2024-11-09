const express = require('express');
const router = express.Router();
const Classroom = require('../models/classroom.model'); // Importa o modelo da turma
const { authenticateToken } = require('../utilities');

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const classroomData = await Classroom.findById(req.params.id).populate('school');
        if (!classroomData) {
            return res.status(404).json({ message: 'Turma não encontrada.' });
        }
        res.status(200).json(classroomData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar a turma.' });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { grade, name, shift, school } = req.body;
        const newClassroom = new Classroom({ grade, name, shift, school });
        await newClassroom.save();
        res.status(201).json({ message: 'Turma adicionada com sucesso.', classroom: newClassroom });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao adicionar a turma.' });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { grade, name, shift } = req.body;
        const updatedClassroom = await Classroom.findByIdAndUpdate(
            req.params.id,
            { grade, name, shift },
            { new: true }
        );
        if (!updatedClassroom) {
            return res.status(404).json({ message: 'Turma não encontrada.' });
        }
        res.status(200).json({ message: 'Turma atualizada com sucesso.', classroom: updatedClassroom });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar a turma.' });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const classroomData = await Classroom.findById(req.params.id);
        if (!classroomData) {
            return res.status(404).json({ message: 'Turma não encontrada.' });
        }

        if (classroomData.totalStudents > 0) {
            return res.status(400).json({ message: 'Não é possível excluir uma turma com alunos.' });
        }

        await Classroom.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Turma excluída com sucesso.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao excluir a turma.' });
    }
});

router.get('/:schoolId/classes', authenticateToken, async (req, res) => {
    try {
        const classes = await Classroom.find({ school: req.params.schoolId });
        res.status(200).json(classes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar as turmas da escola.' });
    }
});

module.exports = router;