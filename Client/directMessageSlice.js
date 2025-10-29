import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  messages: [],
  loading: false,
  error: null,
  typingUsers: [],
};

// Get direct messages
export const getDirectMessages = createAsyncThunk(
  'directMessages/getMessages',
  async ({ friendId, limit, skip }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/api/direct-messages/${friendId}?limit=${limit || 50}&skip=${skip || 0}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Send direct message
export const sendDirectMessage = createAsyncThunk(
  'directMessages/sendMessage',
  async (messageData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/direct-messages', messageData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Mark message as read
export const markMessageAsRead = createAsyncThunk(
  'directMessages/markAsRead',
  async (messageId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/direct-messages/${messageId}/read`);
      return { messageId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const directMessageSlice = createSlice({
  name: 'directMessages',
  initialState,
  reducers: {
    addMessageRealtime: (state, action) => {
      // Check if message already exists to avoid duplicates
      const exists = state.messages.find(msg => msg._id === action.payload._id);
      if (!exists) {
        state.messages.push(action.payload);
      }
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
      .addCase(getDirectMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(getDirectMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(getDirectMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send message
      .addCase(sendDirectMessage.fulfilled, (state, action) => {
        // Message will be added via real-time update, but also add it immediately for better UX
        if (!state.messages.find(msg => msg._id === action.payload._id)) {
          state.messages.push(action.payload);
        }
      })
      // Mark as read
      .addCase(markMessageAsRead.fulfilled, (state, action) => {
        const { messageId, data } = action.payload;
        const message = state.messages.find(msg => msg._id === messageId);
        if (message) {
          message.readBy = data.readBy;
        }
      })
      // Handle real-time message read updates
      .addCase('directMessages/messageReadUpdate', (state, action) => {
        const { messageId, readerId } = action.payload;
        const message = state.messages.find(msg => msg._id === messageId);
        if (message && !message.readBy.some(read => read.user === readerId)) {
          message.readBy.push({
            user: readerId,
            readAt: new Date().toISOString(),
          });
        }
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
} = directMessageSlice.actions;

export default directMessageSlice.reducer;
