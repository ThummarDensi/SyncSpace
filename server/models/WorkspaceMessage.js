const mongoose = require('mongoose');

const workspaceMessageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Message cannot be empty'],
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        size: Number,
      },
    ],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
workspaceMessageSchema.index({ workspace: 1, createdAt: -1 });

module.exports = mongoose.model('WorkspaceMessage', workspaceMessageSchema);
