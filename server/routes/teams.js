const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createTeam,
  getTeams,
  acceptTeamInvite,
  declineTeamInvite,
  addMemberToTeam,
  removeMemberFromTeam,
  generateInviteLink,
  acceptInviteLink,
} = require('../controllers/teamController');

router.route('/')
  .get(protect, getTeams)
  .post(protect, createTeam);

router.put('/:id/accept', protect, acceptTeamInvite);
router.put('/:id/decline', protect, declineTeamInvite);
router.post('/:id/members', protect, addMemberToTeam);
router.delete('/:id/members/:memberId', protect, removeMemberFromTeam);
router.post('/:id/invite', protect, generateInviteLink);
router.post('/join/:token', protect, acceptInviteLink);

module.exports = router;
