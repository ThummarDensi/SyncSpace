const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  addCollaborator,
} = require('../controllers/documentController');

router.post('/', protect, createDocument);
router.get('/:workspaceId', protect, getDocuments);
router.get('/detail/:id', protect, getDocumentById);
router.put('/:id', protect, updateDocument);
router.delete('/:id', protect, deleteDocument);
router.post('/:id/collaborators', protect, addCollaborator);

module.exports = router;
