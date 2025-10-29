const DirectMessage = require('../models/DirectMessage');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { createNotification } = require('./notificationController');

// @desc    Send direct message
// @route   POST /api/direct-messages
// @access  Private
const sendDirectMessage = async (req, res) => {
  try {
    const { content, receiverId, attachments } = req.body;

    // Check if receiver is a friend
    const user = await User.findById(req.user._id);
    if (!user.friends.includes(receiverId)) {
      return res.status(400).json({ message: 'Can only send messages to friends' });
    }

    const message = await DirectMessage.create({
      content,
      sender: req.user._id,
      receiver: receiverId,
      attachments: attachments || [],
      deliveredTo: [{ user: receiverId, deliveredAt: new Date() }], // Mark as delivered immediately
    });

    const populatedMessage = await DirectMessage.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate('receiver', 'name email avatar');

    // Create notification for receiver if they are offline or not in chat
    const receiver = await User.findById(receiverId);
    if (receiver) {
      // Check if receiver is online and currently viewing the chat
      const isReceiverOnline = receiver.isOnline;
      const isInChat = false; // We can't easily track this, so we'll create notification for all messages

      // Create notification for new message
      await createNotification({
        recipient: receiverId,
        sender: req.user._id,
        type: 'direct_message',
        title: 'New Message',
        message: `${user.name} sent you a message: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        link: `/chat/${req.user._id}`,
        data: {
          messageId: message._id,
          senderId: req.user._id,
          content: content,
        },
      });
    }

    // Emit real-time message via Socket.IO
    const io = req.app.get('io');
    if (io) {
      // Send to receiver
      io.to(`user-${receiverId}`).emit('direct-message', populatedMessage);
      // Send back to sender for UI update
      io.to(`user-${req.user._id}`).emit('direct-message', populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get messages between two users
// @route   GET /api/direct-messages/:friendId
// @access  Private
const getDirectMessages = async (req, res) => {
  try {
    const { friendId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    // Check if friend
    const user = await User.findById(req.user._id);
    if (!user.friends.includes(friendId)) {
      return res.status(400).json({ message: 'Can only view messages with friends' });
    }

    const messages = await DirectMessage.find({
      $or: [
        { sender: req.user._id, receiver: friendId },
        { sender: friendId, receiver: req.user._id }
      ],
      isDeleted: false
    })
    .populate('sender', 'name email avatar')
    .populate('receiver', 'name email avatar')
    .sort('-createdAt')
    .limit(parseInt(limit))
    .skip(parseInt(skip));

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark message as read
// @route   PUT /api/direct-messages/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const message = await DirectMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is receiver
    if (message.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if already read
    const alreadyRead = message.readBy.some(
      read => read.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({
        user: req.user._id,
        readAt: new Date(),
      });
      await message.save();

      // Delete the notification for this message since it's been read
      await Notification.findOneAndDelete({
        recipient: req.user._id,
        type: 'direct_message',
        'data.messageId': message._id,
      });
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete message
// @route   DELETE /api/direct-messages/:id
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const message = await DirectMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender can delete
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.isDeleted = true;
    await message.save();

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  sendDirectMessage,
  getDirectMessages,
  markAsRead,
  deleteMessage,
};
