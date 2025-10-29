const Document = require('../models/Document');
const Workspace = require('../models/Workspace');

// @desc    Get documents for workspace
// @route   GET /api/documents/:workspaceId
// @access  Private
const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ workspace: req.params.workspaceId })
      .populate('createdBy', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .populate('collaborators', 'name email avatar')
      .sort('-updatedAt');

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get document by ID
// @route   GET /api/documents/detail/:id
// @access  Private
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .populate('collaborators', 'name email avatar')
      .populate('versions.savedBy', 'name email avatar');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new document
// @route   POST /api/documents
// @access  Private
const createDocument = async (req, res) => {
  try {
    const { title, content, workspaceId } = req.body;

    const document = await Document.create({
      title,
      content: content || '',
      workspace: workspaceId,
      createdBy: req.user._id,
      collaborators: [req.user._id],
      lastEditedBy: req.user._id,
    });

    // Add document to workspace
    await Workspace.findByIdAndUpdate(workspaceId, {
      $push: { documents: document._id },
    });

    const populatedDocument = await Document.findById(document._id)
      .populate('createdBy', 'name email avatar')
      .populate('collaborators', 'name email avatar');

    res.status(201).json(populatedDocument);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update document
// @route   PUT /api/documents/:id
// @access  Private
const updateDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Save previous version if content changed
    if (req.body.content && req.body.content !== document.content) {
      document.versions.push({
        content: document.content,
        savedBy: req.user._id,
        savedAt: new Date(),
      });

      // Keep only last 10 versions
      if (document.versions.length > 10) {
        document.versions = document.versions.slice(-10);
      }
    }

    document.title = req.body.title || document.title;
    document.content = req.body.content !== undefined ? req.body.content : document.content;
    document.lastEditedBy = req.user._id;

    const updatedDocument = await document.save();

    const populatedDocument = await Document.findById(updatedDocument._id)
      .populate('createdBy', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .populate('collaborators', 'name email avatar');

    res.json(populatedDocument);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    await document.deleteOne();

    res.json({ message: 'Document removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add collaborator to document
// @route   POST /api/documents/:id/collaborators
// @access  Private
const addCollaborator = async (req, res) => {
  try {
    const { userId } = req.body;
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if already a collaborator
    if (document.collaborators.includes(userId)) {
      return res.status(400).json({ message: 'User already a collaborator' });
    }

    document.collaborators.push(userId);
    await document.save();

    const updatedDocument = await Document.findById(document._id)
      .populate('collaborators', 'name email avatar');

    res.json(updatedDocument);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  addCollaborator,
};
