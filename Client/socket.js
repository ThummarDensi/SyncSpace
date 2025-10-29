import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(userId, token) {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        auth: {
          userId,
          token,
        },
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Workspace events
  joinWorkspace(workspaceId) {
    if (this.socket) {
      this.socket.emit('join-workspace', workspaceId);
    }
  }

  leaveWorkspace(workspaceId) {
    if (this.socket) {
      this.socket.emit('leave-workspace', workspaceId);
    }
  }

  // Kanban events
  onTaskCreated(callback) {
    if (this.socket) {
      this.socket.on('task-created', callback);
    }
  }

  onTaskUpdated(callback) {
    if (this.socket) {
      this.socket.on('task-updated', callback);
    }
  }

  onTaskDeleted(callback) {
    if (this.socket) {
      this.socket.on('task-deleted', callback);
    }
  }

  onTaskMoved(callback) {
    if (this.socket) {
      this.socket.on('task-moved', callback);
    }
  }

  emitTaskCreated(data) {
    if (this.socket) {
      this.socket.emit('task-created', data);
    }
  }

  emitTaskUpdated(data) {
    if (this.socket) {
      this.socket.emit('task-updated', data);
    }
  }

  emitTaskDeleted(data) {
    if (this.socket) {
      this.socket.emit('task-deleted', data);
    }
  }

  emitTaskMoved(data) {
    if (this.socket) {
      this.socket.emit('task-moved', data);
    }
  }

  // Document events
  joinDocument(documentId) {
    if (this.socket) {
      this.socket.emit('document-join', documentId);
    }
  }

  leaveDocument(documentId) {
    if (this.socket) {
      this.socket.emit('document-leave', documentId);
    }
  }

  onDocumentChange(callback) {
    if (this.socket) {
      this.socket.on('document-change', callback);
    }
  }

  emitDocumentChange(data) {
    if (this.socket) {
      this.socket.emit('document-change', data);
    }
  }

  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on('user-joined', callback);
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on('user-left', callback);
    }
  }

  // Chat events
  onChatMessage(callback) {
    if (this.socket) {
      this.socket.on('chat-message', callback);
    }
  }

  emitChatMessage(data) {
    if (this.socket) {
      this.socket.emit('chat-message', data);
    }
  }

  onTyping(callback) {
    if (this.socket) {
      this.socket.on('typing', callback);
    }
  }

  emitTyping(data) {
    if (this.socket) {
      this.socket.emit('typing', data);
    }
  }

  // Comment events
  onCommentAdded(callback) {
    if (this.socket) {
      this.socket.on('comment-added', callback);
    }
  }

  emitCommentAdded(data) {
    if (this.socket) {
      this.socket.emit('comment-added', data);
    }
  }

  // File events
  onFileUploaded(callback) {
    if (this.socket) {
      this.socket.on('file-uploaded', callback);
    }
  }

  emitFileUploaded(data) {
    if (this.socket) {
      this.socket.emit('file-uploaded', data);
    }
  }

  // Notification events
  onNotification(callback) {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
  }

  onWorkspacesUpdated(callback) {
    if (this.socket) {
      this.socket.on('workspaces-updated', callback);
    }
  }

  onWorkspaceDeleted(callback) {
    if (this.socket) {
      this.socket.on('workspace-deleted', callback);
    }
  }

  onWorkspaceUpdated(callback) {
    if (this.socket) {
      this.socket.on('workspace-updated', callback);
    }
  }

  onBoardCreated(callback) {
    if (this.socket) {
      this.socket.on('board-created', callback);
    }
  }

  onMemberAdded(callback) {
    if (this.socket) {
      this.socket.on('member-added', callback);
    }
  }

  onMemberRemoved(callback) {
    if (this.socket) {
      this.socket.on('member-removed', callback);
    }
  }

  // Direct message events
  onDirectMessage(callback) {
    if (this.socket) {
      this.socket.on('direct-message', callback);
    }
  }

  onDirectTyping(callback) {
    if (this.socket) {
      this.socket.on('direct-typing', callback);
    }
  }

  onMessageReadUpdate(callback) {
    if (this.socket) {
      this.socket.on('message-read-update', callback);
    }
  }

  onNotificationDeleted(callback) {
    if (this.socket) {
      this.socket.on('notification-deleted', callback);
    }
  }

  onUserOnline(callback) {
    if (this.socket) {
      this.socket.on('user-online', callback);
    }
  }

  onUserOffline(callback) {
    if (this.socket) {
      this.socket.on('user-offline', callback);
    }
  }

  emitDirectTyping(data) {
    if (this.socket) {
      this.socket.emit('direct-typing', data);
    }
  }

  emitMessageRead(data) {
    if (this.socket) {
      this.socket.emit('message-read', data);
    }
  }

  // Workspace message events
  onWorkspaceMessage(callback) {
    if (this.socket) {
      this.socket.on('workspace-message', callback);
    }
  }

  emitWorkspaceMessage(data) {
    if (this.socket) {
      this.socket.emit('workspace-message', data);
    }
  }

  onWorkspaceTyping(callback) {
    if (this.socket) {
      this.socket.on('workspace-typing', callback);
    }
  }

  emitWorkspaceTyping(data) {
    if (this.socket) {
      this.socket.emit('workspace-typing', data);
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export default new SocketService();
