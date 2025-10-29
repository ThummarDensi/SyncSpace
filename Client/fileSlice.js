import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  files: [],
  currentFolder: null,
  folderPath: [],
  loading: false,
  error: null,
  searchQuery: '',
  filterType: 'all', // 'all', 'files', 'folders'
};

// Get files for workspace
export const getFiles = createAsyncThunk(
  'file/getFiles',
  async ({ workspaceId, folderId }, { rejectWithValue }) => {
    try {
      const params = folderId ? { folderId } : {};
      const response = await api.get(`/api/files/${workspaceId}`, { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Upload file or folder
export const uploadFile = createAsyncThunk(
  'file/uploadFile',
  async ({ file, workspaceId, folderId, relativePath, isFolder, folderName, parentPath }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('workspaceId', workspaceId);
      if (folderId) {
        formData.append('folderId', folderId);
      }
      if (isFolder) {
        formData.append('isFolder', 'true');
        formData.append('folderName', folderName);
        if (parentPath) {
          formData.append('parentPath', parentPath);
        }
      } else {
        formData.append('file', file);
        if (relativePath) {
          formData.append('relativePath', relativePath);
        }
      }

      const response = await api.post('/api/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);



// Get folder path
export const getFolderPath = createAsyncThunk(
  'file/getFolderPath',
  async (folderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/files/folder/${folderId}/path`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Delete file/folder
export const deleteFile = createAsyncThunk(
  'file/deleteFile',
  async (fileId, { rejectWithValue }) => {
    try {
      await api.delete(`/api/files/${fileId}`);
      return fileId;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Download file
export const downloadFile = createAsyncThunk(
  'file/downloadFile',
  async (fileId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/files/download/${fileId}`, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', response.headers['content-disposition']?.split('filename=')[1] || 'file');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return fileId;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const fileSlice = createSlice({
  name: 'file',
  initialState,
  reducers: {
    setCurrentFolder: (state, action) => {
      state.currentFolder = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setFilterType: (state, action) => {
      state.filterType = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetFiles: (state) => {
      state.files = [];
      state.currentFolder = null;
      state.folderPath = [];
      state.searchQuery = '';
      state.filterType = 'all';
    },
  },
  extraReducers: (builder) => {
    builder
      // Get files
      .addCase(getFiles.pending, (state) => {
        state.loading = true;
      })
      .addCase(getFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload;
      })
      .addCase(getFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Upload file
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.files.push(action.payload);
      })

      // Get folder path
      .addCase(getFolderPath.fulfilled, (state, action) => {
        state.folderPath = action.payload;
      })
      // Delete file/folder
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.files = state.files.filter(file => file._id !== action.payload);
      })
      // Download file
      .addCase(downloadFile.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  setCurrentFolder,
  setSearchQuery,
  setFilterType,
  clearError,
  resetFiles,
} = fileSlice.actions;

export default fileSlice.reducer;
