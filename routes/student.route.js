const express = require('express');
const router = express.Router();
const Student = require('../models/student.model'); // Assumindo que o modelo Student está neste caminho
const Classroom = require('../models/classroom.model');
const Gradebook = require('../models/gradebook.model');
const { authenticateToken } = require('../utilities');
const { default: mongoose } = require('mongoose');

// 1. Rota que busca todos os alunos de uma turma
router.get('/classrooms/:classroomId', authenticateToken, async (req, res) => {
    try {
        const students = await Student.find({ classroom: req.params.classroomId }).sort({ name: 1 });
        res.status(200).json(students);

    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Erro ao buscar alunos da turma', error });
    }
});

// 2. Rota que busca 1 aluno por id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Aluno não encontrado' });
        }
        res.status(200).json(student);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar aluno', error });
    }
});

// 3. Rota que cadastra 1 novo aluno
router.post('/', authenticateToken, async (req, res) => {
    const { name, cpf, birthDate, contact, address, guardian, classroom } = req.body;

    try {
        // Verifica se já existe um aluno com o mesmo CPF
        const existingStudent = await Student.findOne({ cpf });

        if (existingStudent) {
            return res.status(400).json({ message: 'Já existe um aluno cadastrado com este CPF' });
        }

        // Cria o novo aluno
        const newStudent = new Student({ name, cpf, birthDate, contact, address, guardian, classroom });
        const savedStudent = await newStudent.save();

        // Atualiza a turma adicionando o novo aluno no array 'students'
        await Classroom.findByIdAndUpdate(classroom, {
            $push: { students: savedStudent._id }  // Adiciona o aluno ao array de students da turma
        });

        res.status(201).json({ message: 'Aluno cadastrado com sucesso', student: savedStudent });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao cadastrar aluno', error });
    }
});

// 4. Rota que altera os dados de 1 aluno
router.put('/:id', authenticateToken, async (req, res) => {
    const { name, cpf, birthDate, contact, address, guardian } = req.body;

    try {
        const updatedStudent = await Student.findByIdAndUpdate(
            req.params.id,
            { name, cpf, birthDate, contact, address, guardian },
            { new: true }
        );

        if (!updatedStudent) {
            return res.status(404).json({ message: 'Aluno não encontrado' });
        }

        res.status(200).json({ message: 'Aluno atualizado com sucesso', student: updatedStudent });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar aluno', error });
    }
});

// 5. Rota que muda o aluno de turma
router.patch('/:id/change-classroom', authenticateToken, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const studentId = req.params.id;
        const { oldClassroomId, newClassroomId } = req.body;

        // Verificar se a sala atual e a nova sala existem
        const oldClassroom = await Classroom.findById(oldClassroomId).session(session);
        const newClassroom = await Classroom.findById(newClassroomId).session(session);
        if (!oldClassroom || !newClassroom) {
            return res.status(404).json({ message: 'Sala atual ou nova sala não encontrada.' });
        }

        // Verificar se o aluno está na sala atual
        const studentExists = oldClassroom.students.some(
            (id) => id.toString() === studentId.toString()
        );

        if (!studentExists) {
            return res.status(400).json({ message: 'O aluno não pertence à sala atual especificada.' });
        }

        // Atualizar o array de alunos nas salas
        oldClassroom.students = oldClassroom.students.filter(
            (id) => id.toString() !== studentId.toString()
        );
        newClassroom.students.push(studentId);

        // Atualizar o campo classroom no documento do aluno
        const student = await Student.findById(studentId).session(session);
        if (!student) {
            return res.status(404).json({ message: 'Aluno não encontrado.' });
        }
        student.classroom = newClassroomId;

        // Salvar todas as alterações dentro da transação
        await oldClassroom.save({ session });
        await newClassroom.save({ session });
        await student.save({ session });

        // Commit da transação
        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({ message: 'Aluno transferido com sucesso.', newClassroom });
    } catch (error) {
        // Rollback da transação em caso de erro
        await session.abortTransaction();
        session.endSession();
        console.error(error);
        return res.status(500).json({ message: 'Erro ao transferir aluno.', error });
    }
});

// 6. Rota que deleta um aluno
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const deletedStudent = await Student.findByIdAndDelete(req.params.id);

        if (!deletedStudent) {
            return res.status(404).json({ message: 'Aluno não encontrado' });
        }

        // Decrementa o total de alunos na turma
        await Classroom.findByIdAndUpdate(student.classroom, {
            $inc: { totalStudents: -1 }
        });


        res.status(200).json({ message: 'Aluno deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar aluno', error });
    }
});

module.exports = router;