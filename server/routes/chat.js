const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
} = require('../controllers/chatController');

router.get('/:workspaceId', protect, getMessages);
router.post('/', protect, sendMessage);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteMessage);

module.exports = router;
