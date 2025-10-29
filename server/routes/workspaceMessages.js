const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getWorkspaceMessages,
  sendWorkspaceMessage,
  deleteWorkspaceMessage,
} = require('../controllers/workspaceMessageController');

// All routes require authentication
router.use(protect);

// Get workspace messages
router.get('/:workspaceId', getWorkspaceMessages);

// Send workspace message
router.post('/:workspaceId', sendWorkspaceMessage);

// Delete workspace message
router.delete('/:messageId', deleteWorkspaceMessage);

module.exports = router;
