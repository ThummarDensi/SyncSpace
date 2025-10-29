const Comment = require('../models/Comment');
const Task = require('../models/Task');

// @desc    Get comments for task
// @route   GET /api/comments/:taskId
// @access  Private
const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email avatar')
      .sort('createdAt');

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create comment
// @route   POST /api/comments
// @access  Private
const createComment = async (req, res) => {
  try {
    const { content, taskId, mentions, parentCommentId } = req.body;

    const comment = await Comment.create({
      content,
      task: taskId,
      author: req.user._id,
      mentions: mentions || [],
      parentComment: parentCommentId,
    });

    // Add comment to task
    await Task.findByIdAndUpdate(taskId, {
      $push: { comments: comment._id },
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email avatar');

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only author can update
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    comment.content = req.body.content || comment.content;

    const updatedComment = await comment.save();

    const populatedComment = await Comment.findById(updatedComment._id)
      .populate('author', 'name email avatar')
      .populate('mentions', 'name email avatar');

    res.json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only author can delete
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await comment.deleteOne();

    res.json({ message: 'Comment removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment,
};
