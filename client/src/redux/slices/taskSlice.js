import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  tasks: [],
  currentTask: null,
  loading: false,
  error: null,
};

// Get tasks for board
export const getTasks = createAsyncThunk(
  'task/getTasks',
  async (boardId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/tasks/${boardId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Get task by ID
export const getTaskById = createAsyncThunk(
  'task/getTaskById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/tasks/detail/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Create task
export const createTask = createAsyncThunk(
  'task/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/tasks', taskData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Update task
export const updateTask = createAsyncThunk(
  'task/updateTask',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/tasks/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Move task
export const moveTask = createAsyncThunk(
  'task/moveTask',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/tasks/${id}/move`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Delete task
export const deleteTask = createAsyncThunk(
  'task/deleteTask',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/tasks/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    addTaskRealtime: (state, action) => {
      state.tasks.push(action.payload);
    },
    updateTaskRealtime: (state, action) => {
      const index = state.tasks.findIndex((t) => t._id === action.payload._id);
      if (index !== -1) {
        state.tasks[index] = action.payload;
      }
    },
    deleteTaskRealtime: (state, action) => {
      state.tasks = state.tasks.filter((t) => t._id !== action.payload);
    },
    moveTaskRealtime: (state, action) => {
      const { taskId, sourceColumnId, destinationColumnId, sourceIndex, destinationIndex } = action.payload;
      const task = state.tasks.find((t) => t._id === taskId);
      if (task) {
        task.columnId = destinationColumnId;
      }
    },
    setCurrentTask: (state, action) => {
      state.currentTask = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get tasks
      .addCase(getTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(getTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(getTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get task by ID
      .addCase(getTaskById.fulfilled, (state, action) => {
        state.currentTask = action.payload;
      })
      // Create task
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.push(action.payload);
      })
      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex(
          (t) => t._id === action.payload._id
        );
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })
      // Delete task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t._id !== action.payload);
      });
  },
});

export const {
  addTaskRealtime,
  updateTaskRealtime,
  deleteTaskRealtime,
  moveTaskRealtime,
  setCurrentTask,
  clearError,
} = taskSlice.actions;

export default taskSlice.reducer;
