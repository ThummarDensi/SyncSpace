const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a board name'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
    },
    columns: [
      {
        id: String,
        title: String,
        order: Number,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Default columns
boardSchema.pre('save', function (next) {
  if (this.isNew && this.columns.length === 0) {
    this.columns = [
      { id: 'todo', title: 'To Do', order: 0 },
      { id: 'in-progress', title: 'In Progress', order: 1 },
      { id: 'done', title: 'Done', order: 2 },
    ];
  }
  next();
});

module.exports = mongoose.model('Board', boardSchema);
