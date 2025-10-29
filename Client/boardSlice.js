import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  boards: [],
  currentBoard: null,
  loading: false,
  error: null,
};

// Get boards for workspace
export const getBoards = createAsyncThunk(
  'board/getBoards',
  async (workspaceId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/boards/${workspaceId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Get board by ID
export const getBoardById = createAsyncThunk(
  'board/getBoardById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/boards/detail/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Create board
export const createBoard = createAsyncThunk(
  'board/createBoard',
  async (boardData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/boards', boardData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Update board
export const updateBoard = createAsyncThunk(
  'board/updateBoard',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/boards/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Delete board
export const deleteBoard = createAsyncThunk(
  'board/deleteBoard',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/boards/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const boardSlice = createSlice({
  name: 'board',
  initialState,
  reducers: {
    setCurrentBoard: (state, action) => {
      state.currentBoard = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get boards
      .addCase(getBoards.pending, (state) => {
        state.loading = true;
      })
      .addCase(getBoards.fulfilled, (state, action) => {
        state.loading = false;
        state.boards = action.payload;
      })
      .addCase(getBoards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get board by ID
      .addCase(getBoardById.fulfilled, (state, action) => {
        state.currentBoard = action.payload;
      })
      // Create board
      .addCase(createBoard.fulfilled, (state, action) => {
        state.boards.push(action.payload);
      })
      // Update board
      .addCase(updateBoard.fulfilled, (state, action) => {
        const index = state.boards.findIndex(
          (b) => b._id === action.payload._id
        );
        if (index !== -1) {
          state.boards[index] = action.payload;
        }
      })
      // Delete board
      .addCase(deleteBoard.fulfilled, (state, action) => {
        state.boards = state.boards.filter((b) => b._id !== action.payload);
      });
  },
});

export const { setCurrentBoard, clearError } = boardSlice.actions;
export default boardSlice.reducer;
