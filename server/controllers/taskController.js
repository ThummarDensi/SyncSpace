const Task = require('../models/Task');
const Board = require('../models/Board');

// @desc    Get tasks for board
// @route   GET /api/tasks/:boardId
// @access  Private
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ board: req.params.boardId })
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments')
      .sort('order');

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/detail/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'name email avatar' },
      });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      boardId,
      columnId,
      priority,
      assignees,
      dueDate,
      tags,
    } = req.body;

    // Get the count of tasks in the column for ordering
    const tasksCount = await Task.countDocuments({ board: boardId, columnId });

    const task = await Task.create({
      title,
      description,
      board: boardId,
      columnId,
      order: tasksCount,
      priority,
      assignees,
      dueDate,
      tags,
      createdBy: req.user._id,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Update fields
    task.title = req.body.title || task.title;
    task.description = req.body.description !== undefined ? req.body.description : task.description;
    task.columnId = req.body.columnId || task.columnId;
    task.order = req.body.order !== undefined ? req.body.order : task.order;
    task.priority = req.body.priority || task.priority;
    task.assignees = req.body.assignees || task.assignees;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.tags = req.body.tags || task.tags;

    const updatedTask = await task.save();

    const populatedTask = await Task.findById(updatedTask._id)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Move task (drag and drop)
// @route   PUT /api/tasks/:id/move
// @access  Private
const moveTask = async (req, res) => {
  try {
    const { sourceColumnId, destinationColumnId, sourceIndex, destinationIndex } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // If moving within same column
    if (sourceColumnId === destinationColumnId) {
      const tasks = await Task.find({
        board: task.board,
        columnId: sourceColumnId,
      }).sort('order');

      // Reorder tasks
      tasks.splice(sourceIndex, 1);
      tasks.splice(destinationIndex, 0, task);

      // Update order for all tasks
      const updatePromises = tasks.map((t, index) => {
        t.order = index;
        return t.save();
      });

      await Promise.all(updatePromises);
    } else {
      // Moving to different column
      task.columnId = destinationColumnId;

      // Get tasks in destination column
      const destTasks = await Task.find({
        board: task.board,
        columnId: destinationColumnId,
      }).sort('order');

      destTasks.splice(destinationIndex, 0, task);

      // Update order
      const updatePromises = destTasks.map((t, index) => {
        t.order = index;
        return t.save();
      });

      await Promise.all(updatePromises);

      // Reorder source column
      const sourceTasks = await Task.find({
        board: task.board,
        columnId: sourceColumnId,
        _id: { $ne: task._id },
      }).sort('order');

      const sourcePromises = sourceTasks.map((t, index) => {
        t.order = index;
        return t.save();
      });

      await Promise.all(sourcePromises);
    }

    const updatedTask = await Task.findById(task._id)
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.deleteOne();

    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  moveTask,
  deleteTask,
};
