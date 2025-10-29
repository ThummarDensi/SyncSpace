const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  acceptWorkspaceInvite,
  declineWorkspaceInvite,
  addMember,
  removeMember,
} = require('../controllers/workspaceController');

router.route('/')
  .get(protect, getWorkspaces)
  .post(protect, createWorkspace);

router.route('/:id')
  .get(protect, getWorkspaceById)
  .put(protect, updateWorkspace)
  .delete(protect, deleteWorkspace);

router.post('/:id/accept-invite', protect, acceptWorkspaceInvite);
router.post('/:id/decline-invite', protect, declineWorkspaceInvite);
router.post('/:id/members', protect, addMember);
router.delete('/:id/members/:userId', protect, removeMember);

module.exports = router;
