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
        const gradebooks = await Gradebook.find({ teacher: req.params.teacherId })
            .populate('teacher', 'name') // Preenche o campo 'professor' com o nome do professor
            .populate('subject', 'name')   // Preenche o campo 'subject' com o nome da matéria
            .populate('classroom', 'grade name shift') // Preenche o campo 'classroom' com o nome da turma
            .populate('school', '_id')  // Opcional, preenche o campo 'school' com o ID da escola (se necessário)
            .populate('terms.studentEvaluations.student', 'name') // Nome do aluno dentro das avaliações
            .sort({ 'classroom.grade': 1, 'classroom.name': 1 });

        res.status(200).json(gradebooks);
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
            .populate('terms.studentEvaluations.student', 'name') // Nome do aluno dentro das avaliações
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

//---------STUDENT GRADES

// GET: Buscar os dados de um bimestre específico em uma caderneta
router.get('/:gradebookId/term/:termId/evaluations', authenticateToken, async (req, res) => {
    try {
        const { gradebookId, termId } = req.params;

        // Busca a caderneta e popula as informações necessárias
        const gradebook = await Gradebook.findById(gradebookId)
            .populate({
                path: 'classroom',
                populate: {
                    path: 'students',
                    select: 'name cpf _id', // Popula apenas o nome dos alunos
                    strictPopulate: false, // Adicionando a opção para evitar o erro
                },
            })
            .exec();

        if (!gradebook) {
            return res.status(404).json({ message: 'Caderneta não encontrada.' });
        }

        // Encontra o bimestre (termo) específico
        const term = gradebook.terms.find((term) => term._id.toString() === termId);
        if (!term) {
            return res.status(404).json({ message: 'Bimestre não encontrado.' });
        }

        // Lista os alunos da sala
        const students = gradebook.classroom.students;

        // Mapear as avaliações existentes
        const evaluationsMap = new Map(
            term.studentEvaluations.map((evaluation) => [
                evaluation.student.toString(),
                evaluation,
            ])
        );

        // Montar os dados para a resposta com o cálculo das faltas
        const evaluations = await Promise.all(
            students.map(async (student) => {
                const evaluation = evaluationsMap.get(student._id.toString()) || {};

                // Calcular o total de faltas
                let totalAbsences = 0;
                for (const lesson of term.lessons) {
                    const attendance = lesson.attendance.find(
                        (entry) => String(entry.studentId) === String(student._id)
                    );

                    if (attendance && !attendance.present) {
                        totalAbsences++;
                    }
                }

                // Retorna os dados do aluno, incluindo as avaliações e as faltas
                return {
                    student: {
                        name: student.name,
                        _id: student._id,
                        cpf: student.cpf
                    },
                    monthlyExam: evaluation.monthlyExam || 0,
                    bimonthlyExam: evaluation.bimonthlyExam || 0,
                    qualitativeAssessment: evaluation.qualitativeAssessment || 0,
                    bimonthlyGrade: evaluation.bimonthlyGrade || 0,
                    bimonthlyRecovery: evaluation.bimonthlyRecovery || 0,
                    bimonthlyAverage: evaluation.bimonthlyAverage || 0,
                    totalAbsences: totalAbsences, // Total de faltas calculado
                };
            })
        );

        // Ordenar os alunos em ordem alfabética pelo nome
        evaluations.sort((a, b) => a.student.name.localeCompare(b.student.name));

        res.status(200).json(evaluations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar avaliações.' });
    }
});

// PUT: Alterar as avaliações de todos os alunos no bimestre
router.put('/:gradebookId/term/:termId/evaluations', authenticateToken, async (req, res) => {
    try {
        const { gradebookId, termId } = req.params;
        const evaluations = req.body.evaluations; // Array de avaliações

        if (!Array.isArray(evaluations)) {
            return res.status(400).json({ message: 'O corpo da requisição deve conter um array de avaliações.' });
        }

        // Buscar a caderneta e o bimestre especificado
        const gradebook = await Gradebook.findById(gradebookId);
        if (!gradebook) {
            return res.status(404).json({ message: 'Caderneta não encontrada.' });
        }

        const term = gradebook.terms.id(termId);
        if (!term) {
            return res.status(404).json({ message: 'Bimestre não encontrado.' });
        }

        // Se studentEvaluations não existir, inicializa como um array vazio
        if (!term.studentEvaluations) {
            term.studentEvaluations = [];
        }

        let hasChanges = false; // Flag para saber se houve mudanças

        // Atualizar as avaliações dos alunos no bimestre
        evaluations.forEach((evaluation) => {
            let studentEvaluation = term.studentEvaluations.find(
                (entry) => String(entry.student._id) === String(evaluation.student._id)
            );

            if (!studentEvaluation) {
                studentEvaluation = term.studentEvaluations.create({
                    student: {
                        name: evaluation.student.name,
                        _id: evaluation.student._id,
                        cpf: evaluation.student.cpf
                    },
                    monthlyExam: evaluation.monthlyExam,
                    bimonthlyExam: evaluation.bimonthlyExam,
                    qualitativeAssessment: evaluation.qualitativeAssessment,
                    bimonthlyGrade: evaluation.bimonthlyGrade,
                    bimonthlyRecovery: evaluation.bimonthlyRecovery,
                    bimonthlyAverage: evaluation.bimonthlyAverage,
                    totalAbsences: evaluation.totalAbsences
                });

                term.studentEvaluations.push(studentEvaluation);
                hasChanges = true;
            } else {
                // Atualiza apenas se houver mudanças nos valores
                if (
                    studentEvaluation.monthlyExam !== evaluation.monthlyExam ||
                    studentEvaluation.bimonthlyExam !== evaluation.bimonthlyExam ||
                    studentEvaluation.qualitativeAssessment !== evaluation.qualitativeAssessment ||
                    studentEvaluation.bimonthlyGrade !== evaluation.bimonthlyGrade ||
                    studentEvaluation.bimonthlyRecovery !== evaluation.bimonthlyRecovery ||
                    studentEvaluation.bimonthlyAverage !== evaluation.bimonthlyAverage ||
                    studentEvaluation.totalAbsences !== evaluation.totalAbsences
                ) {
                    studentEvaluation.monthlyExam = evaluation.monthlyExam;
                    studentEvaluation.bimonthlyExam = evaluation.bimonthlyExam;
                    studentEvaluation.qualitativeAssessment = evaluation.qualitativeAssessment;
                    studentEvaluation.bimonthlyGrade = evaluation.bimonthlyGrade;
                    studentEvaluation.bimonthlyRecovery = evaluation.bimonthlyRecovery;
                    studentEvaluation.bimonthlyAverage = evaluation.bimonthlyAverage;
                    studentEvaluation.totalAbsences = evaluation.totalAbsences;
                    hasChanges = true;
                }
            }
        });

        if (hasChanges) {
            term.markModified('studentEvaluations'); // Força o Mongoose a reconhecer a mudança
            await gradebook.save();
        }

        // Retornar o array de avaliações atualizado
        const updatedEvaluations = gradebook.terms.id(termId).studentEvaluations;

        res.status(200).json({
            message: 'Avaliações atualizadas com sucesso.',
            evaluations: updatedEvaluations
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar as avaliações.' });
    }
});

// GET: Rota que busca o Registro geral de atividade
router.get('/:gradebookId/learning-record', authenticateToken, async (req, res) => {
    try {
        const { gradebookId } = req.params;

        // Encontrar o gradebook e fazer o populate nos campos necessários
        const gradebook = await Gradebook.findById(gradebookId)
            .populate({
                path: 'classroom',
                populate: {
                    path: 'students',
                    model: 'Student',
                    select: 'name cpf',
                    options: { sort: { name: 1 } } //Ordena os alunos por nome
                },
            })
            .populate('subject', 'name')
            .populate({
                path: 'terms.studentEvaluations.student',
                model: 'Student',
                select: 'name cpf',
            });

        if (!gradebook) {
            return res.status(404).json({ message: 'Gradebook not found' });
        }

        if (!gradebook.classroom || !gradebook.classroom.students) {
            return res.status(404).json({ message: 'No students found for this classroom' });
        }

        // Calcular o registro anual
        const learningRecord = gradebook.classroom.students.map((student) => {
            // Total de faltas
            const totalAbsences = gradebook.terms.reduce((absenceSum, term) => {
                const lessons = term.lessons || [];
                const absencesInTerm = lessons.reduce((lessonAbsences, lesson) => {
                    const attendanceRecord = lesson.attendance.find(
                        (att) => att.studentId.toString() === student._id.toString()
                    );
                    return lessonAbsences + (attendanceRecord && !attendanceRecord.present ? 1 : 0);
                }, 0);
                return absenceSum + absencesInTerm;
            }, 0);

            // Médias bimestrais
            const bimonthlyAverages = gradebook.terms.map((term) => {
                const evaluation = term.studentEvaluations.find(
                    (ev) => ev.student._id.toString() === student._id.toString()
                );
                return {
                    term: term.name,
                    average: evaluation ? evaluation.bimonthlyAverage || 0 : 0,
                };
            });

            // Média anual
            const annualAverage =
                bimonthlyAverages.reduce((sum, b) => sum + b.average, 0) /
                (bimonthlyAverages.length || 1);

            return {
                student: {
                    _id: student._id,
                    name: student.name,
                    cpf: student.cpf,
                },
                bimonthlyAverages,
                annualAverage: parseFloat(annualAverage.toFixed(2)),
                totalAbsences,
            };
        });

        res.status(200).json(learningRecord);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

module.exports = router;