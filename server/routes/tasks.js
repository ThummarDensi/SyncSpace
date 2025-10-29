const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
} = require('../controllers/taskController');

router.post('/', protect, createTask);
router.get('/:boardId', protect, getTasks);
router.get('/detail/:id', protect, getTaskById);
router.put('/:id', protect, updateTask);
router.put('/:id/move', protect, moveTask);
router.delete('/:id', protect, deleteTask);

module.exports = router;
