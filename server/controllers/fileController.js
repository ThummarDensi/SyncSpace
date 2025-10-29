const File = require('../models/File');
const Workspace = require('../models/Workspace');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');

// @desc    Upload file or folder
// @route   POST /api/files/upload
// @access  Private
const uploadFile = async (req, res) => {
  try {
    const { workspaceId, folderId, isFolder, folderName, parentPath, relativePath } = req.body;

    if (isFolder === 'true') {
      // Create folder entry
      const folder = await File.create({
        name: folderName,
        originalName: folderName,
        path: '', // Folders don't have a physical path
        size: 0,
        mimetype: 'folder',
        workspace: workspaceId,
        uploadedBy: req.user._id,
        isFolder: true,
        parentFolder: folderId || null,
      });

      const populatedFolder = await File.findById(folder._id)
        .populate('uploadedBy', 'name email avatar');

      return res.status(201).json(populatedFolder);
    }

    // Handle file upload
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const uploadedFile = req.files[0]; // Take the first file since we're using upload.any()

    const fileDoc = await File.create({
      name: uploadedFile.originalname,
      originalName: uploadedFile.originalname,
      path: uploadedFile.path,
      size: uploadedFile.size,
      mimetype: uploadedFile.mimetype,
      workspace: workspaceId,
      uploadedBy: req.user._id,
      parentFolder: folderId || null,
      versions: [
        {
          version: 1,
          path: uploadedFile.path,
          size: uploadedFile.size,
          uploadedBy: req.user._id,
          uploadedAt: new Date(),
        },
      ],
    });

    // Add file to workspace
    await Workspace.findByIdAndUpdate(workspaceId, {
      $push: { files: fileDoc._id },
    });

    const populatedFileDoc = await File.findById(fileDoc._id)
      .populate('uploadedBy', 'name email avatar');

    res.status(201).json(populatedFileDoc);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get files for workspace
// @route   GET /api/files/:workspaceId
// @access  Private
const getFiles = async (req, res) => {
  try {
    const { folderId } = req.query;
    const query = { workspace: req.params.workspaceId };

    if (folderId) {
      query.parentFolder = folderId;
    } else {
      query.parentFolder = null; // Root level files and folders
    }

    const files = await File.find(query)
      .populate('uploadedBy', 'name email avatar')
      .populate('versions.uploadedBy', 'name email avatar')
      .sort('-createdAt');

    res.json(files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download file or folder
// @route   GET /api/files/download/:id
// @access  Private
const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.isFolder) {
      // Download folder as ZIP
      const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level
      });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${file.name}.zip"`);

      archive.pipe(res);

      // Get all files and subfolders recursively
      const addFilesToArchive = async (folderId, basePath = '') => {
        const items = await File.find({ parentFolder: folderId });

        for (const item of items) {
          if (item.isFolder) {
            // Add empty directory
            archive.append(null, { name: basePath + item.name + '/' });
            // Recursively add contents
            await addFilesToArchive(item._id, basePath + item.name + '/');
          } else {
            // Add file
            if (fs.existsSync(item.path)) {
              archive.file(item.path, { name: basePath + item.originalName });
            }
          }
        }
      };

      await addFilesToArchive(file._id);

      archive.finalize();
    } else {
      // Download single file
      const filePath = path.resolve(file.path);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found on server' });
      }

      res.download(filePath, file.originalName);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete file
// @route   DELETE /api/files/:id
// @access  Private
const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete file from filesystem
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    // Delete all versions
    file.versions.forEach((version) => {
      if (fs.existsSync(version.path)) {
        fs.unlinkSync(version.path);
      }
    });

    await file.deleteOne();

    res.json({ message: 'File removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload new version of file
// @route   POST /api/files/:id/version
// @access  Private
const uploadNewVersion = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    file.currentVersion += 1;
    file.path = req.file.path;
    file.size = req.file.size;

    file.versions.push({
      version: file.currentVersion,
      path: req.file.path,
      size: req.file.size,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    });

    // Keep only last 5 versions
    if (file.versions.length > 5) {
      const oldVersion = file.versions.shift();
      if (fs.existsSync(oldVersion.path)) {
        fs.unlinkSync(oldVersion.path);
      }
    }

    await file.save();

    const populatedFile = await File.findById(file._id)
      .populate('uploadedBy', 'name email avatar')
      .populate('versions.uploadedBy', 'name email avatar');

    res.json(populatedFile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// @desc    Preview file
// @route   GET /api/files/preview/:id
// @access  Private
const previewFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.isFolder) {
      return res.status(400).json({ message: 'Cannot preview folders' });
    }

    // Check if user has access to preview files in this workspace
    const workspace = await Workspace.findById(file.workspace)
      .populate('members.user')
      .populate('team', 'members.user members.role');

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Allow all users to preview files (no permission check needed)

    const filePath = path.resolve(file.path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set appropriate headers for preview
    const ext = path.extname(file.originalName).toLowerCase();
    let contentType = file.mimetype;

    // Override content type for certain file types to ensure proper preview
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
      contentType = `image/${ext.slice(1)}`;
    } else if (ext === '.txt') {
      contentType = 'text/plain';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline'); // Display inline instead of download

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      res.status(500).json({ message: 'Error streaming file' });
    });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get folder path (breadcrumb)
// @route   GET /api/files/folder/:folderId/path
// @access  Private
const getFolderPath = async (req, res) => {
  try {
    const folderId = req.params.folderId;
    const path = [];
    let currentFolder = await File.findById(folderId);

    while (currentFolder) {
      path.unshift({
        _id: currentFolder._id,
        name: currentFolder.name,
        isFolder: currentFolder.isFolder,
      });
      if (currentFolder.parentFolder) {
        currentFolder = await File.findById(currentFolder.parentFolder);
      } else {
        break;
      }
    }

    res.json(path);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadFile,
  getFiles,
  downloadFile,
  deleteFile,
  uploadNewVersion,
  getFolderPath,
  previewFile,
};
