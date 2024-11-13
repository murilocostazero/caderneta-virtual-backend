const express = require('express');
const router = express.Router();
const Student = require('../models/student.model'); // Assumindo que o modelo Student está neste caminho
const Classroom = require('../models/classroom.model');
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
        const newStudent = new Student({ name, cpf, birthDate, contact, address, guardian, classroom });
        const savedStudent = await newStudent.save();

        // Atualiza o total de alunos na turma
        await Classroom.findByIdAndUpdate(classroom, {
            $inc: { totalStudents: 1 }
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
    const { newClassroomId } = req.body;

    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Aluno não encontrado' });
        }

        const oldClassroomId = student.classroom;
        student.classroom = newClassroomId;

        await student.save();

        // Decrementa o total de alunos da turma antiga
        await Classroom.findByIdAndUpdate(oldClassroomId, {
            $inc: { totalStudents: -1 }
        });

        // Incrementa o total de alunos da nova turma
        await Classroom.findByIdAndUpdate(newClassroomId, {
            $inc: { totalStudents: 1 }
        });

        res.status(200).json({ message: 'Aluno movido de turma com sucesso', student });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao mudar o aluno de turma', error });
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