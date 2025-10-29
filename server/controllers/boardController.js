const Board = require('../models/Board');
const Workspace = require('../models/Workspace');

// @desc    Get boards for workspace
// @route   GET /api/boards/:workspaceId
// @access  Private
const getBoards = async (req, res) => {
  try {
    const boards = await Board.find({ workspace: req.params.workspaceId })
      .populate('createdBy', 'name email avatar')
      .sort('-createdAt');

    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get board by ID
// @route   GET /api/boards/detail/:id
// @access  Private
const getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate('workspace')
      .populate('createdBy', 'name email avatar');

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    res.json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new board
// @route   POST /api/boards
// @access  Private
const createBoard = async (req, res) => {
  try {
    const { name, description, workspaceId } = req.body;

    const board = await Board.create({
      name,
      description,
      workspace: workspaceId,
      createdBy: req.user._id,
    });

    // Add board to workspace
    await Workspace.findByIdAndUpdate(workspaceId, {
      $push: { boards: board._id },
    });

    const populatedBoard = await Board.findById(board._id)
      .populate('createdBy', 'name email avatar');

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.to(`workspace-${workspaceId}`).emit('board-created', {
        board: populatedBoard,
        workspaceId,
      });
    }

    res.status(201).json(populatedBoard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update board
// @route   PUT /api/boards/:id
// @access  Private
const updateBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    board.name = req.body.name || board.name;
    board.description = req.body.description || board.description;
    board.columns = req.body.columns || board.columns;

    const updatedBoard = await board.save();

    res.json(updatedBoard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete board
// @route   DELETE /api/boards/:id
// @access  Private
const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    await board.deleteOne();

    res.json({ message: 'Board removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBoards,
  getBoardById,
  createBoard,
  updateBoard,
  deleteBoard,
};
