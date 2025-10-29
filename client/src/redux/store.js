import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import workspaceReducer from './slices/workspaceSlice';
import boardReducer from './slices/boardSlice';
import taskReducer from './slices/taskSlice';
import documentReducer from './slices/documentSlice';
import chatReducer from './slices/chatSlice';
import notificationReducer from './slices/notificationSlice';
import friendReducer from './slices/friendSlice';
import directMessageReducer from './slices/directMessageSlice';
import fileReducer from './slices/fileSlice';
import workspaceMessageReducer from './slices/workspaceMessageSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    board: boardReducer,
    task: taskReducer,
    document: documentReducer,
    chat: chatReducer,
    notification: notificationReducer,
    friends: friendReducer,
    directMessages: directMessageReducer,
    files: fileReducer,
    workspaceMessages: workspaceMessageReducer,
  },
});
