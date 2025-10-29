const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
} = require('../controllers/boardController');

router.post('/', protect, createBoard);
router.get('/:workspaceId', protect, getBoards);
router.get('/detail/:id', protect, getBoardById);
router.put('/:id', protect, updateBoard);
router.delete('/:id', protect, deleteBoard);

module.exports = router;
