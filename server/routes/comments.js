const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');

router.get('/:taskId', protect, getComments);
router.post('/', protect, createComment);
router.put('/:id', protect, updateComment);
router.delete('/:id', protect, deleteComment);

module.exports = router;
