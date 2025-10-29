const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendDirectMessage,
  getDirectMessages,
  markAsRead,
  deleteMessage,
} = require('../controllers/directMessageController');

router.get('/:friendId', protect, getDirectMessages);
router.post('/', protect, sendDirectMessage);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteMessage);

module.exports = router;
