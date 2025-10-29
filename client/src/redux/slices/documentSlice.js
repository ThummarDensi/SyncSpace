import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  documents: [],
  currentDocument: null,
  loading: false,
  error: null,
};

// Get documents for workspace
export const getDocuments = createAsyncThunk(
  'document/getDocuments',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/documents/${workspaceId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Get document by ID
export const getDocumentById = createAsyncThunk(
  'document/getDocumentById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/documents/detail/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Create document
export const createDocument = createAsyncThunk(
  'document/createDocument',
  async (documentData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/documents', documentData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Update document
export const updateDocument = createAsyncThunk(
  'document/updateDocument',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/documents/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Delete document
export const deleteDocument = createAsyncThunk(
  'document/deleteDocument',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/documents/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const documentSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    setCurrentDocument: (state, action) => {
      state.currentDocument = action.payload;
    },
    updateDocumentContent: (state, action) => {
      if (state.currentDocument) {
        state.currentDocument.content = action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get documents
      .addCase(getDocuments.pending, (state) => {
        state.loading = true;
      })
      .addCase(getDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload;
      })
      .addCase(getDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get document by ID
      .addCase(getDocumentById.fulfilled, (state, action) => {
        state.currentDocument = action.payload;
      })
      // Create document
      .addCase(createDocument.fulfilled, (state, action) => {
        state.documents.push(action.payload);
      })
      // Update document
      .addCase(updateDocument.fulfilled, (state, action) => {
        const index = state.documents.findIndex(
          (d) => d._id === action.payload._id
        );
        if (index !== -1) {
          state.documents[index] = action.payload;
        }
        if (state.currentDocument?._id === action.payload._id) {
          state.currentDocument = action.payload;
        }
      })
      // Delete document
      .addCase(deleteDocument.fulfilled, (state, action) => {
        state.documents = state.documents.filter(
          (d) => d._id !== action.payload
        );
      });
  },
});

export const { setCurrentDocument, updateDocumentContent, clearError } =
  documentSlice.actions;

export default documentSlice.reducer;
