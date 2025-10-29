const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  uploadFile,
  getFiles,
  downloadFile,
  deleteFile,
  uploadNewVersion,
  getFolderPath,
  previewFile,
} = require('../controllers/fileController');

router.post('/upload', protect, upload.any(), uploadFile);
router.get('/:workspaceId', protect, getFiles);
router.get('/folder/:folderId/path', protect, getFolderPath);
router.get('/download/:id', protect, downloadFile);
router.get('/preview/:id', previewFile);
router.delete('/:id', protect, deleteFile);
router.post('/:id/version', protect, upload.single('file'), uploadNewVersion);

module.exports = router;
