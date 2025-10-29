import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { updateFriendOnline, updateFriendOffline } from './redux/slices/friendSlice';
import { removeNotification, addNotificationRealtime } from './redux/slices/notificationSlice';
import { getWorkspaces } from './redux/slices/workspaceSlice';
import socketService from './services/socket';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WorkspaceDetail from './pages/WorkspaceDetail';
import KanbanBoard from './pages/KanbanBoard';
import DocumentEditor from './pages/DocumentEditor';
import Chat from './pages/Chat';
import Files from './pages/Files';
import Friends from './pages/Friends';
import MyFriends from './pages/MyFriends';
import DirectChat from './pages/DirectChat';

// Components
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

function App() {
  const { user, isAuthenticated, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isAuthenticated && user && token) {
      socketService.connect(user._id, token);

      // Set up global socket listeners
      socketService.onUserOnline((data) => {
        dispatch(updateFriendOnline(data));
      });

      socketService.onUserOffline((data) => {
        dispatch(updateFriendOffline(data));
      });

      socketService.onNotificationDeleted((data) => {
        dispatch(removeNotification(data));
      });

      socketService.onNotification((data) => {
        dispatch(addNotificationRealtime(data));
        // If notification is about team member added, refresh workspaces
        if (data.type === 'team_member_added') {
          dispatch(getWorkspaces());
        }
      });

      socketService.onWorkspacesUpdated(() => {
        dispatch(getWorkspaces());
      });

      socketService.onWorkspaceDeleted((data) => {
        dispatch(getWorkspaces());
      });
    }

    return () => {
      if (isAuthenticated) {
        socketService.disconnect();
      }
    };
  }, [isAuthenticated, user, token, dispatch]);

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="friends" element={<Friends />} />
            <Route path="my-friends" element={<MyFriends />} />
            <Route path="chat/:friendId" element={<DirectChat />} />
            <Route path="workspace/:workspaceId" element={<WorkspaceDetail />} />
            <Route path="workspace/:workspaceId/board/:boardId" element={<KanbanBoard />} />
            <Route path="workspace/:workspaceId/document/:documentId" element={<DocumentEditor />} />
            <Route path="workspace/:workspaceId/chat" element={<Chat />} />
            <Route path="workspace/:workspaceId/files" element={<Files />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default App;
