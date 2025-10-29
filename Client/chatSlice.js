import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  messages: [],
  loading: false,
  error: null,
  typingUsers: [],
};

// Get messages for workspace
export const getMessages = createAsyncThunk(
  'chat/getMessages',
  async ({ workspaceId, limit, skip }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/chat/${workspaceId}?limit=${limit || 50}&skip=${skip || 0}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Send message
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (messageData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/chat', messageData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessageRealtime: (state, action) => {
      state.messages.push(action.payload);
    },
    setTypingUsers: (state, action) => {
      state.typingUsers = action.payload;
    },
    addTypingUser: (state, action) => {
      if (!state.typingUsers.find((u) => u.userId === action.payload.userId)) {
        state.typingUsers.push(action.payload);
      }
    },
    removeTypingUser: (state, action) => {
      state.typingUsers = state.typingUsers.filter(
        (u) => u.userId !== action.payload
      );
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get messages
      .addCase(getMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send message
      .addCase(sendMessage.fulfilled, (state, action) => {
        // Message will be added via real-time update
      });
  },
});

export const {
  addMessageRealtime,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  clearMessages,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;
