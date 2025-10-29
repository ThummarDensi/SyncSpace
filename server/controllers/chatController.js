const Message = require('../models/Message');

// @desc    Get messages for workspace
// @route   GET /api/chat/:workspaceId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const messages = await Message.find({ workspace: req.params.workspaceId })
      .populate('sender', 'name email avatar')
      .populate('mentions', 'name email avatar')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send message
// @route   POST /api/chat
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { content, workspaceId, mentions, attachments } = req.body;

    const message = await Message.create({
      content,
      workspace: workspaceId,
      sender: req.user._id,
      mentions: mentions || [],
      attachments: attachments || [],
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate('mentions', 'name email avatar');

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark message as read
// @route   PUT /api/chat/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if already read by user
    const alreadyRead = message.readBy.some(
      (read) => read.user.toString() === req.user._id.toString()
    );

    if (!alreadyRead) {
      message.readBy.push({
        user: req.user._id,
        readAt: new Date(),
      });

      await message.save();
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete message
// @route   DELETE /api/chat/:id
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only sender can delete
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await message.deleteOne();

    res.json({ message: 'Message removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  markAsRead,
  deleteMessage,
};
