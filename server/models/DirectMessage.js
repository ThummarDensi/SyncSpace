const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema(
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
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    readBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    deliveredTo: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        deliveredAt: {
          type: Date,
          default: Date.now,
        },
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
directMessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });
directMessageSchema.index({ receiver: 1, sender: 1, createdAt: -1 });

module.exports = mongoose.model('DirectMessage', directMessageSchema);
