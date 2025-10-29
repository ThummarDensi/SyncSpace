import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  messages: [],
  loading: false,
  error: null,
  typingUsers: [],
};

// Get workspace messages
export const getWorkspaceMessages = createAsyncThunk(
  'workspaceMessage/getMessages',
  async ({ workspaceId, limit, skip }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/workspace-messages/${workspaceId}?limit=${limit || 50}&skip=${skip || 0}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Send workspace message
export const sendWorkspaceMessage = createAsyncThunk(
  'workspaceMessage/sendMessage',
  async (messageData, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/workspace-messages/${messageData.workspaceId}`, messageData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Delete workspace message
export const deleteWorkspaceMessage = createAsyncThunk(
  'workspaceMessage/deleteMessage',
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/workspace-messages/${messageId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const workspaceMessageSlice = createSlice({
  name: 'workspaceMessage',
  initialState,
  reducers: {
    addWorkspaceMessageRealtime: (state, action) => {
      state.messages.push(action.payload);
    },
    setWorkspaceTypingUsers: (state, action) => {
      state.typingUsers = action.payload;
    },
    addWorkspaceTypingUser: (state, action) => {
      if (!state.typingUsers.find((u) => u.userId === action.payload.userId)) {
        state.typingUsers.push(action.payload);
      }
    },
    removeWorkspaceTypingUser: (state, action) => {
      state.typingUsers = state.typingUsers.filter(
        (u) => u.userId !== action.payload
      );
    },
    clearWorkspaceMessages: (state) => {
      state.messages = [];
    },
    clearWorkspaceMessageError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get messages
      .addCase(getWorkspaceMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(getWorkspaceMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload.data || [];
      })
      .addCase(getWorkspaceMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send message
      .addCase(sendWorkspaceMessage.fulfilled, (state, action) => {
        // Message will be added via real-time update
      })
      // Delete message
      .addCase(deleteWorkspaceMessage.fulfilled, (state, action) => {
        state.messages = state.messages.filter(msg => msg._id !== action.meta.arg);
      });
  },
});

export const {
  addWorkspaceMessageRealtime,
  setWorkspaceTypingUsers,
  addWorkspaceTypingUser,
  removeWorkspaceTypingUser,
  clearWorkspaceMessages,
  clearWorkspaceMessageError,
} = workspaceMessageSlice.actions;

export default workspaceMessageSlice.reducer;
