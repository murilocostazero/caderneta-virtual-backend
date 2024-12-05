const express = require('express');
const router = express.Router();
const Gradebook = require('../models/gradebook.model');
const Student = require('../models/student.model');
const { authenticateToken } = require('../utilities');

// 1. Rota que busca um gradebook por ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const gradebook = await Gradebook.findById(req.params.id)
            .populate('teacher', 'name') // Preenche o campo 'professor' com o nome do professor
            .populate('subject', 'name')   // Preenche o campo 'subject' com o nome da matéria
            .populate('classroom', 'grade name shift') // Preenche o campo 'classroom' com o nome da turma
            .populate('school', '_id');  // Opcional, preenche o campo 'school' com o ID da escola (se necessário)

        if (!gradebook) {
            return res.status(404).json({ message: "Gradebook not found" });
        }

        res.status(200).json(gradebook);
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
    const { academicYear, school, classroom, teacher, subject } = req.body;

    const newGradebook = new Gradebook({
        academicYear,
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
    const { academicYear, skill, school, classroom, teacher, subject } = req.body;

    try {
        const updatedGradebook = await Gradebook.findByIdAndUpdate(
            req.params.id,
            { academicYear, skill, school, classroom, teacher, subject },
            { new: true }
        );
        if (!updatedGradebook) {
            return res.status(404).json({ message: "Gradebook not found" });
        }
        res.status(200).json(updatedGradebook);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 6. Adicionar um novo TermSchema
router.post('/:gradebookId/term', authenticateToken, async (req, res) => {
    try {
        const { gradebookId } = req.params;
        const { name, startDate, endDate } = req.body;

        const gradebook = await Gradebook.findById(gradebookId)
            .populate('teacher', 'name')
            .populate('subject', 'name')
            .populate('classroom', 'grade name shift')
            .populate('school', '_id');

        if (!gradebook) {
            return res.status(404).json({ message: "Gradebook não encontrado" });
        }

        // Criação do novo TermSchema
        const newTerm = {
            name,
            startDate,
            endDate,
            lessons: [],
            studentEvaluations: []
        };

        // Adicionar o novo Term ao gradebook
        gradebook.terms.push(newTerm);
        await gradebook.save();

        res.status(201).json({ message: "Bimestre adicionado com sucesso!", gradebook });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 7. Atualizar um TermSchema existente
router.put('/:gradebookId/term/:termId', authenticateToken, async (req, res) => {
    try {
        const { gradebookId, termId } = req.params;
        const { name, startDate, endDate } = req.body;

        const gradebook = await Gradebook.findById(gradebookId)
            .populate('teacher', 'name')
            .populate('subject', 'name')
            .populate('classroom', 'grade name shift')
            .populate('school', '_id');

        if (!gradebook) {
            return res.status(404).json({ message: "Gradebook não encontrado" });
        }

        // Encontrar o Term pelo ID
        const term = gradebook.terms.id(termId);
        if (!term) {
            return res.status(404).json({ message: "Bimestre não encontrado" });
        }

        // Atualizar os dados do Term
        if (name) term.name = name;
        if (startDate) term.startDate = startDate;
        if (endDate) term.endDate = endDate;

        await gradebook.save();

        res.status(200).json({ message: "Bimestre atualizado com sucesso!", gradebook });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 8. Rota para adicionar uma nova Lesson
router.post('/:gradebookId/term/:termId/lesson', authenticateToken, async (req, res) => {
    const { topic, date } = req.body;
    if (!topic || !date) {
        return res.status(400).json({ message: 'Assunto e data são obrigatórios' });
    }

    try {
        const gradebook = await Gradebook.findById(req.params.gradebookId)
            .populate('teacher', 'name') // Preenche o campo 'professor' com o nome do professor
            .populate('subject', 'name')   // Preenche o campo 'subject' com o nome da matéria
            .populate('classroom', 'grade name shift') // Preenche o campo 'classroom' com o nome da turma
            .populate('school', '_id');

        if (!gradebook) {
            return res.status(404).json({ message: 'Caderneta não encontrada' });
        }

        const term = gradebook.terms.id(req.params.termId);
        if (!term) {
            return res.status(404).json({ message: 'Bimestre não encontrado' });
        }

        term.lessons.push({ topic, date });
        await gradebook.save();

        res.status(201).json({ message: 'Aula adicionada com sucesso', gradebook }); //Retorno o gradebook pra atualizar o componente
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 9. Rota para editar uma Lesson
router.put('/:gradebookId/term/:termId/lesson/:lessonId', authenticateToken, async (req, res) => {
    const { topic, date } = req.body;

    try {
        const gradebook = await Gradebook.findById(req.params.gradebookId)
            .populate('teacher', 'name') // Preenche o campo 'professor' com o nome do professor
            .populate('subject', 'name')   // Preenche o campo 'subject' com o nome da matéria
            .populate('classroom', 'grade name shift') // Preenche o campo 'classroom' com o nome da turma
            .populate('school', '_id');

        if (!gradebook) {
            return res.status(404).json({ message: 'Gradebook not found.' });
        }

        const term = gradebook.terms.id(req.params.termId);
        if (!term) {
            return res.status(404).json({ message: 'Term not found.' });
        }

        const lesson = term.lessons.id(req.params.lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found.' });
        }

        if (topic) lesson.topic = topic;
        if (date) lesson.date = date;

        // Ordenar as aulas por data após atualizar a lesson
        term.lessons = term.lessons.sort((a, b) => new Date(a.date) - new Date(b.date));

        await gradebook.save();
        res.status(200).json({ message: 'Lesson updated successfully.', gradebook });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Rota para excluir uma Lesson
router.delete('/:gradebookId/term/:termId/lesson/:lessonId', authenticateToken, async (req, res) => {
    try {
        const gradebook = await Gradebook.findById(req.params.gradebookId);
        if (!gradebook) {
            return res.status(404).json({ message: 'Gradebook not found.' });
        }

        const term = gradebook.terms.id(req.params.termId);
        if (!term) {
            return res.status(404).json({ message: 'Term not found.' });
        }

        const lesson = term.lessons.id(req.params.lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found.' });
        }

        lesson.remove();
        await gradebook.save();

        res.status(200).json({ message: 'Lesson deleted successfully.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//Rota para criar uma chamada
router.post('/:gradebookId/term/:termId/lesson/:lessonId/attendance', authenticateToken, async (req, res) => {
    const { attendance } = req.body; // Array de { studentId, present }

    try {
        const gradebook = await Gradebook.findById(req.params.gradebookId)
            .populate('teacher', 'name') // Preenche o campo 'professor' com o nome do professor
            .populate('subject', 'name')   // Preenche o campo 'subject' com o nome da matéria
            .populate('classroom', 'grade name shift') // Preenche o campo 'classroom' com o nome da turma
            .populate('school', '_id');  // Opcional, preenche o campo 'school' com o ID da escola (se necessário)

        if (!gradebook) {
            return res.status(404).json({ message: 'Caderneta não encontrada' });
        }

        const term = gradebook.terms.id(req.params.termId);
        if (!term) {
            return res.status(404).json({ message: 'Bimestre não encontrado' });
        }

        const lesson = term.lessons.id(req.params.lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Aula não encontrada' });
        }

        if (lesson.attendance && lesson.attendance.length > 0) {
            return res.status(400).json({ message: 'Já existe uma chamada para essa aula' });
        }

        lesson.attendance = attendance; // Adiciona a chamada
        await gradebook.save();

        res.status(201).json({ message: 'Chamada criada com sucesso', gradebook });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Rota para editar uma chamada
router.put('/:gradebookId/term/:termId/lesson/:lessonId/attendance', authenticateToken, async (req, res) => {
    const { attendance } = req.body; // Array atualizado

    try {
        const gradebook = await Gradebook.findById(req.params.gradebookId)
            .populate('teacher', 'name') // Preenche o campo 'professor' com o nome do professor
            .populate('subject', 'name')   // Preenche o campo 'subject' com o nome da matéria
            .populate('classroom', 'grade name shift') // Preenche o campo 'classroom' com o nome da turma
            .populate('school', '_id')  // Opcional, preenche o campo 'school' com o ID da escola (se necessário)
            .sort({ 'classroom.grade': 1, 'classroom.name': 1 });

        if (!gradebook) {
            return res.status(404).json({ message: 'Gradebook not found.' });
        }

        const term = gradebook.terms.id(req.params.termId);
        if (!term) {
            return res.status(404).json({ message: 'Term not found.' });
        }

        const lesson = term.lessons.id(req.params.lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found.' });
        }

        lesson.attendance = attendance; // Atualiza a chamada
        await gradebook.save();

        res.status(200).json({ message: 'Attendance updated successfully.', gradebook });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Rota que busca uma chamada
router.get('/:gradebookId/term/:termId/lesson/:lessonId/attendance', authenticateToken, async (req, res) => {
    try {
        const gradebook = await Gradebook.findById(req.params.gradebookId)
            .populate({
                path: 'terms.lessons.attendance.studentId',
                select: 'name', // Popula apenas o nome do aluno
                options: { strictPopulate: false }, // Desativa o strictPopulate
            });

        if (!gradebook) {
            return res.status(404).json({ message: 'Gradebook not found.' });
        }

        const term = gradebook.terms.id(req.params.termId);
        if (!term) {
            return res.status(404).json({ message: 'Term not found.' });
        }

        const lesson = term.lessons.id(req.params.lessonId);
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found.' });
        }

        res.status(200).json({
            lesson: {
                topic: lesson.topic,
                date: lesson.date,
                attendance: lesson.attendance,
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;