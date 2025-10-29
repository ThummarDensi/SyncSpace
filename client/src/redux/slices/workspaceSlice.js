import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  workspaces: [],
  currentWorkspace: null,
  loading: false,
  error: null,
};

// Get all workspaces
export const getWorkspaces = createAsyncThunk(
  'workspace/getWorkspaces',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/workspaces');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Get workspace by ID
export const getWorkspaceById = createAsyncThunk(
  'workspace/getWorkspaceById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/workspaces/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Create workspace
export const createWorkspace = createAsyncThunk(
  'workspace/createWorkspace',
  async (workspaceData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/workspaces', workspaceData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Get workspace by ID with password
export const getWorkspaceByIdWithPassword = createAsyncThunk(
  'workspace/getWorkspaceByIdWithPassword',
  async ({ id, password }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/workspaces/${id}?password=${password}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Update workspace
export const updateWorkspace = createAsyncThunk(
  'workspace/updateWorkspace',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/workspaces/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Accept workspace invitation
export const acceptWorkspaceInvite = createAsyncThunk(
  'workspace/acceptWorkspaceInvite',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/workspaces/${workspaceId}/accept-invite`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Decline workspace invitation
export const declineWorkspaceInvite = createAsyncThunk(
  'workspace/declineWorkspaceInvite',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/workspaces/${workspaceId}/decline-invite`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Delete workspace
export const deleteWorkspace = createAsyncThunk(
  'workspace/deleteWorkspace',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/workspaces/${id}`);
      return { id, message: response.data.message };
    } catch (error) {
      // If the error is 404, it means the workspace was deleted successfully
      if (error.response?.status === 404) {
        return { id, message: 'Workspace deleted successfully' };
      }
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Add member to workspace
export const addMember = createAsyncThunk(
  'workspace/addMember',
  async ({ workspaceId, userId }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/workspaces/${workspaceId}/members`, { userId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setCurrentWorkspace: (state, action) => {
      state.currentWorkspace = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get workspaces
      .addCase(getWorkspaces.pending, (state) => {
        state.loading = true;
      })
      .addCase(getWorkspaces.fulfilled, (state, action) => {
        state.loading = false;
        state.workspaces = action.payload;
      })
      .addCase(getWorkspaces.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get workspace by ID
      .addCase(getWorkspaceById.pending, (state) => {
        state.loading = true;
      })
      .addCase(getWorkspaceById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWorkspace = action.payload;
      })
      .addCase(getWorkspaceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get workspace by ID with password
      .addCase(getWorkspaceByIdWithPassword.pending, (state) => {
        state.loading = true;
      })
      .addCase(getWorkspaceByIdWithPassword.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWorkspace = action.payload;
      })
      .addCase(getWorkspaceByIdWithPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create workspace
      .addCase(createWorkspace.fulfilled, (state, action) => {
        state.workspaces.push(action.payload);
      })
      // Update workspace
      .addCase(updateWorkspace.fulfilled, (state, action) => {
        const index = state.workspaces.findIndex(
          (w) => w._id === action.payload._id
        );
        if (index !== -1) {
          state.workspaces[index] = action.payload;
        }
        if (state.currentWorkspace?._id === action.payload._id) {
          state.currentWorkspace = action.payload;
        }
      })
      // Accept workspace invitation
      .addCase(acceptWorkspaceInvite.fulfilled, (state, action) => {
        // Add the workspace to the user's workspace list
        if (action.payload.workspace && !state.workspaces.find(w => w._id === action.payload.workspace._id)) {
          state.workspaces.push(action.payload.workspace);
        }
      })
      // Decline workspace invitation
      .addCase(declineWorkspaceInvite.fulfilled, (state, action) => {
        // No state changes needed for declining
      })
      // Delete workspace
      .addCase(deleteWorkspace.fulfilled, (state, action) => {
        state.workspaces = state.workspaces.filter(
          (w) => w._id !== action.payload
        );
        // Clear current workspace if it was deleted
        if (state.currentWorkspace && state.currentWorkspace._id === action.payload) {
          state.currentWorkspace = null;
        }
      })
      // Add member to workspace
      .addCase(addMember.fulfilled, (state, action) => {
        // Update the current workspace with new member data
        if (state.currentWorkspace?._id === action.payload._id) {
          state.currentWorkspace = action.payload;
        }
        // Also update in workspaces list
        const index = state.workspaces.findIndex(
          (w) => w._id === action.payload._id
        );
        if (index !== -1) {
          state.workspaces[index] = action.payload;
        }
      });
  },
});

export const { setCurrentWorkspace, clearError } = workspaceSlice.actions;
export default workspaceSlice.reducer;
