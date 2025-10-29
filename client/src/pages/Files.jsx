import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  getFiles,
  uploadFile,
  getFolderPath,
  deleteFile,
  downloadFile,
  setCurrentFolder,
  setSearchQuery,
  setFilterType,
  resetFiles,
} from '../redux/slices/fileSlice';
import { getWorkspaceById } from '../redux/slices/workspaceSlice';
import toast from 'react-hot-toast';
import './Files.css';

const Files = () => {
  const { workspaceId } = useParams();
  const dispatch = useDispatch();
  const {
    files,
    currentFolder,
    folderPath,
    loading,
    error,
    searchQuery,
    filterType,
  } = useSelector((state) => state.files);
  const { currentWorkspace } = useSelector((state) => state.workspace);

  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  useEffect(() => {
    if (workspaceId) {
      loadFiles();
      dispatch(getWorkspaceById(workspaceId));
    }
    return () => {
      dispatch(resetFiles());
    };
  }, [workspaceId, currentFolder, dispatch]);

  const loadFiles = async () => {
    try {
      await dispatch(getFiles({ workspaceId, folderId: currentFolder })).unwrap();
      if (currentFolder) {
        await dispatch(getFolderPath(currentFolder)).unwrap();
      }
    } catch (error) {
      toast.error('Failed to load files');
    }
  };

  const handleFileUpload = async (files) => {
    try {
      setUploadLoading(true);
      const folderMap = new Map();
      const fileList = Array.from(files);
      const createdFolders = new Map(); // Map path to folder ID

      // Group files by their relative paths to create folder structure
      for (const file of fileList) {
        const relativePath = file.webkitRelativePath || file.name;
        const pathParts = relativePath.split('/');

        // Create folders if they don't exist
        for (let i = 0; i < pathParts.length - 1; i++) {
          const folderPath = pathParts.slice(0, i + 1).join('/');
          if (!folderMap.has(folderPath)) {
            folderMap.set(folderPath, {
              name: pathParts[i],
              parentPath: pathParts.slice(0, i).join('/') || null,
              isFolder: true,
            });
          }
        }

        // Add file
        folderMap.set(relativePath, {
          file,
          relativePath,
          isFolder: false,
        });
      }

      // Upload folders in hierarchical order
      const folderPaths = Array.from(folderMap.keys()).filter(path => folderMap.get(path).isFolder);
      folderPaths.sort((a, b) => a.split('/').length - b.split('/').length); // Sort by depth

      for (const path of folderPaths) {
        const item = folderMap.get(path);
        try {
          const parentFolderId = item.parentPath ? createdFolders.get(item.parentPath) : currentFolder;
          const result = await dispatch(uploadFile({
            file: null,
            workspaceId,
            folderId: parentFolderId,
            folderName: item.name,
            isFolder: true,
          })).unwrap();
          createdFolders.set(path, result._id);
        } catch (error) {
          toast.error(`Failed to create folder ${item.name}`);
        }
      }

      // Upload files
      for (const [path, item] of folderMap) {
        if (!item.isFolder) {
          try {
            const pathParts = path.split('/');
            const parentPath = pathParts.slice(0, -1).join('/');
            const parentFolderId = parentPath ? createdFolders.get(parentPath) : currentFolder;
            await dispatch(uploadFile({
              file: item.file,
              workspaceId,
              folderId: parentFolderId,
              isFolder: false,
            })).unwrap();
            toast.success(`${item.file.name} uploaded successfully`);
          } catch (error) {
            toast.error(`Failed to upload ${item.file.name}`);
          }
        }
      }
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFileUpload(droppedFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFileUpload(selectedFiles);
  };

  const handleFolderSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      handleFileUpload(selectedFiles);
    }
  };



  const handleFileClick = (file) => {
    if (file.isFolder) {
      dispatch(setCurrentFolder(file._id));
    } else {
      // Allow all users to preview files (no permission check needed)
      setSelectedFile(file);
      setShowPreview(true);
    }
  };

  const handleBreadcrumbClick = (folderId) => {
    dispatch(setCurrentFolder(folderId));
  };

  const handleDelete = async (fileId, fileName) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      try {
        setDeleteLoading(true);
        await dispatch(deleteFile(fileId)).unwrap();
        toast.success('File deleted successfully');
      } catch (error) {
        toast.error('Failed to delete file');
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const handleDownload = async (file) => {
    try {
      await dispatch(downloadFile(file._id)).unwrap();
      toast.success('Download started');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const getFileIcon = (file) => {
    if (file.isFolder) {
      return '📁';
    }

    const ext = file.originalName.split('.').pop().toLowerCase();
    const iconMap = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      xls: '📊',
      xlsx: '📊',
      txt: '📄',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      zip: '📦',
      rar: '📦',
    };

    return iconMap[ext] || '📄';
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'files' && !file.isFolder) ||
      (filterType === 'folders' && file.isFolder);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="files-page">
      <div className="files-header">
        <h1>Files</h1>
        <div className="files-actions">
          <button
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadLoading}
          >
            <span>📤</span>
            {uploadLoading ? 'Uploading...' : 'Upload Files'}
          </button>
          <button
            className="folder-btn"
            onClick={() => folderInputRef.current?.click()}
            disabled={uploadLoading}
          >
            <span>📁</span>
            {uploadLoading ? 'Uploading...' : 'Upload Folder'}
          </button>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {folderPath.length > 0 && (
        <div className="breadcrumb">
          <span
            className="breadcrumb-item"
            onClick={() => handleBreadcrumbClick(null)}
          >
            Root
          </span>
          {folderPath.map((folder, index) => (
            <span key={folder._id}>
              <span className="breadcrumb-separator"> / </span>
              <span
                className="breadcrumb-item"
                onClick={() => handleBreadcrumbClick(folder._id)}
              >
                {folder.name}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Search and Filter */}
      <div className="controls">
        <input
          type="text"
          className="search-input"
          placeholder="Search files and folders..."
          value={searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
        />
        <select
          className="filter-select"
          value={filterType}
          onChange={(e) => dispatch(setFilterType(e.target.value))}
        >
          <option value="all">All Items</option>
          <option value="files">Files Only</option>
          <option value="folders">Folders Only</option>
        </select>
      </div>

      {/* Drag and Drop Zone */}
      <div
        className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="drop-zone-text">
          📂 Drop files here to upload
        </div>
        <div className="drop-zone-subtext">
          or click "Upload Files" to select files
        </div>
      </div>

      {/* Files Grid */}
      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="empty-state">
          <h3>No files found</h3>
          <p>
            {searchQuery || filterType !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Upload some files or create a folder to get started'
            }
          </p>
        </div>
      ) : (
        <div className="files-grid">
          {filteredFiles.map((file) => (
            <div
              key={file._id}
              className="file-card"
              onClick={() => handleFileClick(file)}
            >
              <div className="file-icon">
                {getFileIcon(file)}
              </div>
              <div className="file-info">
                <div className="file-name">{file.name}</div>
                {!file.isFolder && (
                  <div className="file-meta">
                    {formatFileSize(file.size)} • {file.uploadedBy?.name || 'Unknown'}
                  </div>
                )}
                <div className="file-actions">
                  <button
                    className="action-btn download-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(file);
                    }}
                  >
                    ↓
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(file._id, file.name);
                    }}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? 'Deleting...' : '🗑️'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Preview Modal */}
      {showPreview && selectedFile && (
        <div className="preview-modal" onClick={() => setShowPreview(false)}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3>{selectedFile.name}</h3>
              <button
                className="close-btn"
                onClick={() => setShowPreview(false)}
              >
                ✕
              </button>
            </div>
            <div className="preview-body">
              {selectedFile.originalName.toLowerCase().endsWith('.txt') && (
                <iframe
                  src={`/api/files/preview/${selectedFile._id}`}
                  className="text-preview"
                  title={selectedFile.name}
                />
              )}
              {selectedFile.originalName.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/i) && (
                <img
                  src={`/api/files/preview/${selectedFile._id}`}
                  alt={selectedFile.name}
                  className="image-preview"
                />
              )}
              {selectedFile.originalName.toLowerCase().endsWith('.pdf') && (
                <iframe
                  src={`/api/files/preview/${selectedFile._id}`}
                  className="pdf-preview"
                  title={selectedFile.name}
                />
              )}
              {!selectedFile.originalName.toLowerCase().match(/\.(txt|jpg|jpeg|png|gif|pdf)$/i) && (
                <div className="unsupported-preview">
                  <p>Preview not available for this file type</p>
                  <button
                    className="download-btn"
                    onClick={() => handleDownload(selectedFile)}
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        webkitdirectory=""
        style={{ display: 'none' }}
        onChange={handleFolderSelect}
      />
    </div>
  );
};

export default Files;
