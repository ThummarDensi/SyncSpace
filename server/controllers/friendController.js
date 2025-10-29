const User = require('../models/User');

// @desc    Send friend request
// @route   POST /api/friends/request
// @access  Private
const sendFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.body;

    // Check if friendId is an email or user ID
    let friend;
    if (friendId.includes('@')) {
      // It's an email, find user by email
      friend = await User.findOne({ email: friendId });
    } else {
      // It's a user ID
      friend = await User.findById(friendId);
    }

    if (!friend) {
      return res.status(404).json({ message: 'User not found' });
    }

    const friendIdStr = friend._id.toString();

    if (friendIdStr === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    // Check if already friends
    if (req.user.friends.includes(friendIdStr)) {
      return res.status(400).json({ message: 'Already friends' });
    }

    // Check if request already exists
    const existingRequest = friend.friendRequests.find(
      request => request.from.toString() === req.user._id.toString()
    );

    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already sent' });
    }

    // Add friend request
    friend.friendRequests.push({ from: req.user._id });
    await friend.save();

    res.status(201).json({ message: 'Friend request sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept friend request
// @route   PUT /api/friends/accept/:requestId
// @access  Private
const acceptFriendRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const requestIndex = user.friendRequests.findIndex(
      request => request._id.toString() === req.params.requestId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    const request = user.friendRequests[requestIndex];
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    // Add to friends list
    user.friends.push(request.from);
    // Remove the request from friendRequests array
    user.friendRequests.splice(requestIndex, 1);
    await user.save();

    // Add to friend's friends list
    await User.findByIdAndUpdate(request.from, {
      $push: { friends: req.user._id }
    });

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject friend request
// @route   PUT /api/friends/reject/:requestId
// @access  Private
const rejectFriendRequest = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const requestIndex = user.friendRequests.findIndex(
      request => request._id.toString() === req.params.requestId
    );

    if (requestIndex === -1) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    // Remove the request from friendRequests array
    user.friendRequests.splice(requestIndex, 1);
    await user.save();

    res.json({ message: 'Friend request rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get friends list
// @route   GET /api/friends
// @access  Private
const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'name email avatar isOnline lastSeen');
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get friend requests
// @route   GET /api/friends/requests
// @access  Private
const getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('friendRequests.from', 'name email avatar');
    res.json(user.friendRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove friend
// @route   DELETE /api/friends/:friendId
// @access  Private
const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;

    // Remove from user's friends
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { friends: friendId }
    });

    // Remove from friend's friends
    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: req.user._id }
    });

    res.json({ message: 'Friend removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  getFriendRequests,
  removeFriend,
};
