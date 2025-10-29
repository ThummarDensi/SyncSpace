const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getFriendRequests,
  removeFriend,
} = require('../controllers/friendController');

router.post('/request', protect, sendFriendRequest);
router.put('/accept/:requestId', protect, acceptFriendRequest);
router.put('/reject/:requestId', protect, rejectFriendRequest);
router.get('/', protect, getFriends);
router.get('/requests', protect, getFriendRequests);
router.delete('/:friendId', protect, removeFriend);

module.exports = router;
