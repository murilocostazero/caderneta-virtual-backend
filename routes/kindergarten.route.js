const express = require('express');
const router = express.Router();
const Kindergarten = require('../models/kindergarten.model');
const Student = require('../models/student.model');
const ExperienceField = require('../models/experienceField.model');
const { authenticateToken, sortLessonsInGradebook } = require('../utilities');

// 1. Rota que busca um kindergarten por ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const kindergarten = await Kindergarten.findById(req.params.id)
            .populate('teacher', 'name') // Preenche o campo 'professor' com o nome do professor
            .populate('classroom', 'classroomType grade name shift') // Preenche o campo 'classroom' com o nome da turma
            .populate('school', '_id');  // Opcional, preenche o campo 'school' com o ID da escola (se necessário)

        if (!kindergarten) {
            return res.status(404).json({ message: "Kindergarten not found" });
        }

        sortLessonsInGradebook(kindergarten);

        res.status(200).json(kindergarten);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Rota que busca todos os kindergartens de um teacher
router.get('/teacher/:teacherId', authenticateToken, async (req, res) => {
    try {
        const kindergartens = await Kindergarten.find({ teacher: req.params.teacherId })
            .populate('teacher', 'name') // Popula o campo 'teacher' com o nome do professor
            .populate('classroom', 'classroomType grade name shift') // Popula 'classroom'
            .populate('school', '_id')  // Popula 'school' com o ID da escola
            .sort({ 'classroom.grade': 1, 'classroom.name': 1 });

        // Ordenar as lessons dentro de cada term do gradebook
        const sortedGradebooks = kindergartens.map(gradebook => {
            gradebook.terms.forEach(term => {
                if (term.lessons && Array.isArray(term.lessons)) {
                    // Ordena por data (ou outro campo, como 'index' se tiver)
                    term.lessons.sort((a, b) => new Date(a.date) - new Date(b.date));
                }
            });
            return gradebook;
        });

        res.status(200).json(sortedGradebooks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 3. Rota que busca todos os kindergartens de uma escola
router.get('/school/:schoolId', authenticateToken, async (req, res) => {
    try {
        const kindergartens = await Kindergarten.find({ school: req.params.schoolId })
            .populate('teacher', 'name') // Preenche o campo 'professor' com o nome do professor
            .populate('classroom', 'classroomType grade name shift') // Preenche o campo 'classroom' com o nome da turma
            .populate('school', '_id')  // Opcional, preenche o campo 'school' com o ID da escola (se necessário)
            .populate('terms.studentEvaluations.student.name', 'name') // Nome do aluno dentro das avaliações
            .sort({ 'classroom.grade': 1, 'classroom.name': 1 });

        // Ordenar as lessons dentro de cada term do gradebook
        const sortedGradebooks = kindergartens.map(gradebook => {
            gradebook.terms.forEach(term => {
                if (term.lessons && Array.isArray(term.lessons)) {
                    // Ordena por data (ou outro campo, como 'index' se tiver)
                    term.lessons.sort((a, b) => new Date(a.date) - new Date(b.date));
                }
            });
            return gradebook;
        });

        res.status(200).json(sortedGradebooks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 4. Rota que adiciona um novo kindergarten
router.post('/', authenticateToken, async (req, res) => {
    const { academicYear, school, classroom, teacher } = req.body;

    const newKindergarten = new Kindergarten({
        academicYear,
        school,
        classroom,
        teacher
    });

    try {
        const savedKindergarten = await newKindergarten.save();
        res.status(201).json(savedKindergarten);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 5. Rota que altera os dados do kindergarten
router.put('/:id', authenticateToken, async (req, res) => {
    const { academicYear, school, classroom, teacher } = req.body;

    try {
        const updatedKindergarten = await Kindergarten.findByIdAndUpdate(
            req.params.id,
            { academicYear, school, classroom, teacher },
            { new: true }
        );
        if (!updatedKindergarten) {
            return res.status(404).json({ message: "Kindergarten not found" });
        }
        res.status(200).json(updatedKindergarten);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 6. Adicionar um novo TermSchema
router.post('/:kindergartenId/term', authenticateToken, async (req, res) => {
    try {
        const { kindergartenId } = req.params;
        const { name, startDate, endDate } = req.body;

        const kindergarten = await Kindergarten.findById(kindergartenId)
            .populate('teacher', 'name')
            .populate('classroom', 'classroomType grade name shift')
            .populate('school', '_id');

        if (!kindergarten) {
            return res.status(404).json({ message: "Kindergarten não encontrado" });
        }

        // Criação do novo TermSchema
        const newTerm = {
            name,
            startDate,
            endDate,
            lessons: [],
            studentEvaluations: []
        };

        // Adicionar o novo Term ao kindergarten
        kindergarten.terms.push(newTerm);
        await kindergarten.save();

        res.status(201).json({ message: "Bimestre adicionado com sucesso!", kindergarten });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 7. Atualizar um TermSchema existente
router.put('/:kindergartenId/term/:termId', authenticateToken, async (req, res) => {
    try {
        const { kindergartenId, termId } = req.params;
        const { name, startDate, endDate } = req.body;

        const kindergarten = await Kindergarten.findById(kindergartenId)
            .populate('teacher', 'name')
            .populate('classroom', 'classroomType grade name shift')
            .populate('school', '_id');

        if (!kindergarten) {
            return res.status(404).json({ message: "Kindergarten não encontrado" });
        }

        // Encontrar o Term pelo ID
        const term = kindergarten.terms.id(termId);
        if (!term) {
            return res.status(404).json({ message: "Bimestre não encontrado" });
        }

        // Atualizar os dados do Term
        if (name) term.name = name;
        if (startDate) term.startDate = startDate;
        if (endDate) term.endDate = endDate;

        await kindergarten.save();

        res.status(200).json({ message: "Bimestre atualizado com sucesso!", kindergarten });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//Deletar um term
router.delete('/:kindergartenId/term/:termId', authenticateToken, async (req, res) => {
    try {
        const { kindergartenId, termId } = req.params;

        // Buscar o diário escolar (Gradebook)
        const kindergarten = await Kindergarten.findById(kindergartenId)
            .populate('teacher', 'name') // Popula o campo 'teacher' com o nome do professor
            .populate('classroom', 'classroomType grade name shift') // Popula 'classroom'
            .populate('school', '_id')  // Popula 'school' com o ID da escola
            .sort({ 'classroom.grade': 1, 'classroom.name': 1 });

        if (!kindergarten) {
            return res.status(404).json({ message: "Kindergarten não encontrado" });
        }

        // Filtrar e remover o Term pelo ID
        const termIndex = kindergarten.terms.findIndex(term => term._id.toString() === termId);
        if (termIndex === -1) {
            return res.status(404).json({ message: "Bimestre não encontrado" });
        }

        kindergarten.terms.splice(termIndex, 1); // Remove o Term da lista

        await kindergarten.save(); // Salva as alterações

        res.status(200).json({ message: "Bimestre removido com sucesso!", kindergarten: kindergarten });
    } catch (err) {
        res.status(500).json({ message: "Erro ao remover o bimestre", error: err.message });
    }
});

// 8. Rota para adicionar uma nova Lesson
router.post('/:kindergartenId/term/:termId/lesson', authenticateToken, async (req, res) => {
    const { topic, date } = req.body;
    if (!topic || !date) {
        return res.status(400).json({ message: 'Assunto e data são obrigatórios' });
    }

    try {
        const kindergarten = await Kindergarten.findById(req.params.kindergartenId)
            .populate('teacher', 'name') // Preenche o campo 'professor' com o nome do professor
            .populate('classroom', 'classroomType grade name shift') // Preenche o campo 'classroom' com o nome da turma
            .populate('school', '_id');

        if (!kindergarten) {
            return res.status(404).json({ message: 'Caderneta não encontrada' });
        }

        const term = kindergarten.terms.id(req.params.termId);
        if (!term) {
            return res.status(404).json({ message: 'Bimestre não encontrado' });
        }

        term.lessons.push({ topic, date });
        await kindergarten.save();

        // Recarrega o gradebook com os populates
        const updatedGradebook = await Kindergarten.findById(req.params.kindergartenId)
            .populate('teacher', 'name')
            .populate('classroom', 'classroomType grade name shift')
            .populate('school', '_id');

        sortLessonsInGradebook(updatedGradebook);

        res.status(201).json({ message: 'Aula adicionada com sucesso', kindergarten: updatedGradebook }); //Retorno o kindergarten pra atualizar o componente
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 9. Rota para editar uma Lesson
router.put('/:kindergartenId/term/:termId/lesson/:lessonId', authenticateToken, async (req, res) => {
    const { topic, date } = req.body;

    try {
        const kindergarten = await Kindergarten.findById(req.params.kindergartenId)
            .populate('teacher', 'name') // Preenche o campo 'professor' com o nome do professor
            .populate('classroom', 'classroomType grade name shift') // Preenche o campo 'classroom' com o nome da turma
            .populate('school', '_id');

        if (!kindergarten) {
            return res.status(404).json({ message: 'Kindergarten not found.' });
        }

        const term = kindergarten.terms.id(req.params.termId);
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

        await kindergarten.save();

        // Recarrega o gradebook com os populates
        const updatedGradebook = await Kindergarten.findById(req.params.kindergartenId)
            .populate('teacher', 'name')
            .populate('classroom', 'classroomType grade name shift')
            .populate('school', '_id');

        sortLessonsInGradebook(updatedGradebook);

        res.status(200).json({ message: 'Lesson updated successfully.', kindergarten: updatedGradebook });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Rota para excluir uma Lesson
router.delete('/:kindergartenId/term/:termId/lesson/:lessonId', authenticateToken, async (req, res) => {
    try {
        const kindergarten = await Kindergarten.findById(req.params.kindergartenId)
            .populate('teacher', 'name') // Popula o campo 'teacher' com o nome do professor
            .populate('classroom', 'classroomType grade name shift') // Popula 'classroom'
            .populate('school', '_id')  // Popula 'school' com o ID da escola
            .sort({ 'classroom.grade': 1, 'classroom.name': 1 });

        if (!kindergarten) {
            return res.status(404).json({ message: 'Kindergarten not found.' });
        }

        const term = kindergarten.terms.id(req.params.termId);
        if (!term) {
            return res.status(404).json({ message: 'Term not found.' });
        }

        // Removendo a Lesson do array de lessons
        term.lessons.pull(req.params.lessonId);

        await kindergarten.save();

        // Recarrega o gradebook com os populates
        const updatedGradebook = await Kindergarten.findById(req.params.kindergartenId)
            .populate('teacher', 'name')
            .populate('classroom', 'classroomType grade name shift')
            .populate('school', '_id');

        sortLessonsInGradebook(updatedGradebook);

        res.status(200).json({ message: 'Lesson deleted successfully.', kindergarten: updatedGradebook });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//Rota para criar uma chamada
router.post('/:kindergartenId/term/:termId/lesson/:lessonId/attendance', authenticateToken, async (req, res) => {
    const { attendance } = req.body; // Array de { studentId, present }

    try {
        const gradebook = await Kindergarten.findById(req.params.kindergartenId)
            .populate('teacher', 'name') // Preenche o campo 'professor' com o nome do professor
            .populate('classroom', 'classroomType grade name shift') // Preenche o campo 'classroom' com o nome da turma
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
router.put('/:kindergartenId/term/:termId/lesson/:lessonId/attendance', authenticateToken, async (req, res) => {
    const { attendance } = req.body; // Array atualizado

    try {
        const gradebook = await Kindergarten.findById(req.params.kindergartenId)
            .populate('teacher', 'name') // Preenche o campo 'professor' com o nome do professor
            .populate('classroom', 'classroomType grade name shift') // Preenche o campo 'classroom' com o nome da turma
            .populate('school', '_id')  // Opcional, preenche o campo 'school' com o ID da escola (se necessário)
            .sort({ 'classroom.grade': 1, 'classroom.name': 1 });

        if (!gradebook) {
            return res.status(404).json({ message: 'Kindergarten not found.' });
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
router.get('/:kindergartenId/term/:termId/lesson/:lessonId/attendance', authenticateToken, async (req, res) => {
    try {
        const kindergarten = await Kindergarten.findById(req.params.kindergartenId)
            .populate({
                path: 'terms.lessons.attendance.studentId',
                select: 'name', // Popula apenas o nome do aluno
                options: { strictPopulate: false }, // Desativa o strictPopulate
            });

        if (!kindergarten) {
            return res.status(404).json({ message: 'Kindergarten not found.' });
        }

        const term = kindergarten.terms.id(req.params.termId);
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
router.get('/:kindergartenId/term/:termId/evaluations', authenticateToken, async (req, res) => {
    try {
        const { kindergartenId, termId } = req.params;

        // Buscar o diário escolar e popular a turma
        const gradebook = await Kindergarten.findById(kindergartenId)
            .populate({
                path: 'classroom',
                populate: {
                    path: 'students',
                    select: 'name cpf _id',
                    strictPopulate: false,
                },
            })
            .exec();

        if (!gradebook) {
            return res.status(404).json({ message: "Diário não encontrado" });
        }

        // Buscar o bimestre correto dentro do diário
        const term = gradebook.terms.id(termId);
        if (!term) {
            return res.status(404).json({ message: "Bimestre não encontrado" });
        }

        // Lista de alunos da sala
        const students = gradebook.classroom.students;

        // Buscar todos os campos de experiência disponíveis
        const experienceFields = await ExperienceField.find({ school: gradebook.school });

        // Criar um mapa de avaliações existentes
        const existingEvaluations = new Map();
        term.studentEvaluations.forEach(studentEval => {
            existingEvaluations.set(String(studentEval.student._id), studentEval);
        });

        // Construir a lista final de avaliações garantindo que todos os alunos tenham registros
        const formattedEvaluations = await Promise.all(
            students.map(async (student) => {
                const studentEval = existingEvaluations.get(String(student._id));

                // Calcular total de faltas
                let totalAbsences = 0;
                for (const lesson of term.lessons) {
                    const attendance = lesson.attendance.find(
                        (entry) => String(entry.studentId) === String(student._id)
                    );

                    if (attendance && !attendance.present) {
                        totalAbsences++;
                    }
                }

                return {
                    student: {
                        _id: student._id,
                        name: student.name,
                        cpf: student.cpf
                    },
                    evaluations: studentEval
                        ? studentEval.evaluations
                        : experienceFields.map(field => ({
                            fieldName: field.name,
                            evaluationCriteria: "not-yet"
                        })), // Adiciona os experienceFields corretamente
                    totalAbsences: totalAbsences,
                };
            })
        );

        res.status(200).json({ evaluations: formattedEvaluations });

    } catch (error) {
        console.error("Erro ao buscar avaliações:", error);
        res.status(500).json({ message: 'Erro ao buscar avaliações.', error: error.message });
    }
});

// PUT: Alterar as avaliações de todos os alunos no bimestre
router.put('/:kindergartenId/term/:termId/evaluations', authenticateToken, async (req, res) => {
    try {
        const { kindergartenId, termId } = req.params;
        const { evaluations } = req.body; // Array de avaliações

        // Buscar o diário escolar
        const gradebook = await Kindergarten.findById(kindergartenId);
        if (!gradebook) {
            return res.status(404).json({ message: "Diário não encontrado" });
        }

        // Buscar o bimestre correto dentro do diário
        const term = gradebook.terms.id(termId);
        if (!term) {
            return res.status(404).json({ message: "Bimestre não encontrado" });
        }

        // Percorrer cada avaliação enviada do front
        evaluations.forEach((newEvaluation) => {
            const { student, evaluations, totalAbsences } = newEvaluation;

            // Verifica se o aluno já tem avaliação nesse bimestre
            const existingStudentEvaluation = term.studentEvaluations.find(
                (entry) => String(entry.student._id) === String(student._id)
            );

            if (existingStudentEvaluation) {
                // Atualiza as avaliações existentes do aluno
                evaluations.forEach((newEval) => {
                    const existingEvalIndex = existingStudentEvaluation.evaluations.findIndex(
                        (eval) => eval.fieldName === newEval.fieldName
                    );

                    if (existingEvalIndex !== -1) {
                        // Se a avaliação do campo já existe, atualiza o status
                        existingStudentEvaluation.evaluations[existingEvalIndex].evaluationCriteria = newEval.evaluationCriteria;
                    } else {
                        // Se não existe, adiciona um novo campo de experiência
                        existingStudentEvaluation.evaluations.push(newEval);
                    }
                });

                // Atualiza o total de faltas do aluno
                existingStudentEvaluation.totalAbsences = totalAbsences;

            } else {
                // Se o aluno ainda não tem avaliações nesse bimestre, adiciona tudo de uma vez
                term.studentEvaluations.push({
                    student,
                    evaluations,
                    totalAbsences
                });
            }
        });

        // Salvar as alterações no banco
        await gradebook.save();

        const updatedEvaluations = gradebook.terms.id(termId).studentEvaluations;

        res.status(200).json({ message: 'Avaliações atualizadas com sucesso.', evaluations: updatedEvaluations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao atualizar avaliações.', error: error.message });
    }
});

// Rota para obter o Registro Geral
router.get('/:kindergartenId/general-record', authenticateToken, async (req, res) => {
    try {
        const { kindergartenId } = req.params;

        // Buscar o diário escolar
        const gradebook = await Kindergarten.findById(kindergartenId);
        if (!gradebook) {
            return res.status(404).json({ message: "Diário não encontrado" });
        }

        // Mapeamento dos critérios em ordem de progressão
        const criteriaOrder = ['not-yet', 'under-development', 'developed'];

        // Criar estrutura para armazenar o critério final e total de faltas de cada aluno
        const finalEvaluations = {};

        // Iterar sobre todos os bimestres
        gradebook.terms.forEach(term => {
            term.studentEvaluations.forEach(studentEval => {
                const studentId = String(studentEval.student._id);

                if (!finalEvaluations[studentId]) {
                    finalEvaluations[studentId] = {
                        student: studentEval.student,
                        evaluations: {},
                        totalAbsences: 0 // Inicializa o total de faltas
                    };
                }

                // Somar as faltas do aluno no bimestre atual
                finalEvaluations[studentId].totalAbsences += studentEval.totalAbsences || 0;

                // Iterar sobre as avaliações do aluno
                studentEval.evaluations.forEach(evaluation => {
                    const fieldName = evaluation.fieldName;
                    const currentCriteria = evaluation.evaluationCriteria;

                    if (!finalEvaluations[studentId].evaluations[fieldName]) {
                        finalEvaluations[studentId].evaluations[fieldName] = currentCriteria;
                    } else {
                        // Comparar com o critério anterior e manter o mais avançado
                        const prevCriteria = finalEvaluations[studentId].evaluations[fieldName];
                        finalEvaluations[studentId].evaluations[fieldName] =
                            criteriaOrder.indexOf(currentCriteria) > criteriaOrder.indexOf(prevCriteria)
                                ? currentCriteria
                                : prevCriteria;
                    }
                });
            });
        });

        res.status(200).json({ generalRecord: Object.values(finalEvaluations) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar registro geral.', error: error.message });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const kindergarten = await Kindergarten.findByIdAndDelete(req.params.id);
        if (!kindergarten) return res.status(404).json({ message: 'Caderneta não encontrada' });
        res.status(200).json({ message: 'Caderneta removida com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover caderneta.', error });
    }
});

module.exports = router;