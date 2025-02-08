const express = require('express');
const router = express.Router();
const SchoolSubject = require('../models/schoolSubject.model');
const User = require('../models/user.model'); // Para manipular associações com professores
const { authenticateToken } = require('../utilities');

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const subject = await SchoolSubject.findById(req.params.id).populate('teachers');
        if (!subject) return res.status(404).json({ message: 'Disciplina não encontrada.' });
        res.status(200).json(subject);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar disciplina.', error });
    }
});

//Rota para buscar todas as disciplinas da escola
router.get('/school/:schoolId', authenticateToken, async (req, res) => {
    try {
        const subjects = await SchoolSubject.find({ school: req.params.schoolId })
        .populate('teachers')        
        .sort({ 'name': 1 });
        
        res.status(200).json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar disciplinas.', error });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, workload, schoolId } = req.body;
        const newSubject = new SchoolSubject({ name, workload, school: schoolId });
        await newSubject.save();
        res.status(201).json({ message: 'Disciplina criada com sucesso.', subject: newSubject });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar disciplina.', error });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    console.log(req.body)
    try {
        const { name, workload } = req.body;
        const subject = await SchoolSubject.findByIdAndUpdate(
            req.params.id,
            { name, workload },
            { new: true }
        );
        if (!subject) return res.status(404).json({ message: 'Disciplina não encontrada.' });
        res.status(200).json({ message: 'Disciplina atualizada com sucesso.', subject });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar disciplina.', error });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const subject = await SchoolSubject.findByIdAndDelete(req.params.id);
        if (!subject) return res.status(404).json({ message: 'Disciplina não encontrada.' });
        res.status(200).json({ message: 'Disciplina removida com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover disciplina.', error });
    }
});

//Rota para associar um professor a uma disciplina
router.put('/:subjectId/add-teacher/:teacherId', authenticateToken, async (req, res) => {
    try {
        const subject = await SchoolSubject.findById(req.params.subjectId);
        const teacher = await User.findById(req.params.teacherId);

        if (!subject || !teacher) {
            return res.status(404).json({ message: 'Disciplina ou professor não encontrado.' });
        }

        // Adiciona o professor à lista de teachers da disciplina
        if (!subject.teachers.includes(teacher._id)) {
            subject.teachers.push(teacher._id);
            await subject.save();
        }

        // Adiciona a disciplina à lista de subjects do professor
        if (!teacher.subjects.includes(subject._id)) {
            teacher.subjects.push(subject._id);
            await teacher.save();
        }

        res.status(200).json({ message: 'Professor associado à disciplina com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao associar professor à disciplina.', error });
    }
});

//Rota para desassociar o professor da disciplina
router.put('/:subjectId/remove-teacher/:teacherId', authenticateToken, async (req, res) => {
    try {
        const subject = await SchoolSubject.findById(req.params.subjectId);
        const teacher = await User.findById(req.params.teacherId);

        if (!subject || !teacher) {
            return res.status(404).json({ message: 'Disciplina ou professor não encontrado.' });
        }

        // Remove o professor da lista de teachers da disciplina
        subject.teachers = subject.teachers.filter(t => !t.equals(teacher._id));
        await subject.save();

        // Remove a disciplina da lista de subjects do professor
        teacher.subjects = teacher.subjects.filter(s => !s.equals(subject._id));
        await teacher.save();

        res.status(200).json({ message: 'Professor desassociado da disciplina com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao desassociar professor da disciplina.', error });
    }
});

module.exports = router;