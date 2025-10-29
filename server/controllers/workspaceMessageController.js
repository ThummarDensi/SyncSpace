const WorkspaceMessage = require('../models/WorkspaceMessage');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// Get workspace messages
const getWorkspaceMessages = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    // Check if user is a member of the workspace
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      'members.user': req.user._id,
    });

    if (!workspace) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this workspace.',
      });
    }

    const messages = await WorkspaceMessage.find({
      workspace: workspaceId,
      isDeleted: false,
    })
      .populate('sender', 'name avatar')
      .populate('mentions', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    // Reverse to get chronological order
    messages.reverse();

    res.json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error('Error getting workspace messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Send workspace message
const sendWorkspaceMessage = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { content, attachments, mentions } = req.body;

    // Check if user is a member of the workspace
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      'members.user': req.user._id,
    });

    if (!workspace) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this workspace.',
      });
    }

    // Create message
    const message = new WorkspaceMessage({
      content,
      sender: req.user._id,
      workspace: workspaceId,
      attachments: attachments || [],
      mentions: mentions || [],
    });

    await message.save();
    await message.populate('sender', 'name avatar');
    await message.populate('mentions', 'name');

    // Create notifications for mentioned users
    if (mentions && mentions.length > 0) {
      for (const mentionedUserId of mentions) {
        if (mentionedUserId.toString() !== req.user._id.toString()) {
          await createNotification({
            recipient: mentionedUserId,
            sender: req.user._id,
            type: 'workspace_mention',
            title: 'You were mentioned in workspace chat',
            message: `${req.user.name} mentioned you in ${workspace.name}`,
            link: `/workspace/${workspaceId}/chat`,
            data: { messageId: message._id },
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Error sending workspace message:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Delete workspace message
const deleteWorkspaceMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await WorkspaceMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Check if user is the sender or workspace admin
    const workspace = await Workspace.findOne({
      _id: message.workspace,
      'members.user': req.user._id,
    });

    if (!workspace) {
      return res.status(403).json({
        success: false,
        message: 'Access denied.',
      });
    }

    const member = workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );

    if (
      message.sender.toString() !== req.user._id.toString() &&
      member.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages.',
      });
    }

    message.isDeleted = true;
    await message.save();

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting workspace message:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  getWorkspaceMessages,
  sendWorkspaceMessage,
  deleteWorkspaceMessage,
};
