const { createNotification } = require('../controllers/notificationController');
const User = require('../models/User');
const DirectMessage = require('../models/DirectMessage');

const setupSocketIO = (io) => {
  // Middleware for Socket.IO authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      // You can add JWT verification here if needed
      socket.userId = socket.handshake.auth.userId;
      next();
    } else {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Update user online status
    User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date()
    }).then(() => {
      // Notify friends about online status
      socket.broadcast.emit('user-online', { userId: socket.userId });
    });

    // Join workspace room
    socket.on('join-workspace', (workspaceId) => {
      socket.join(`workspace-${workspaceId}`);
      console.log(`User ${socket.userId} joined workspace ${workspaceId}`);
    });

    // Leave workspace room
    socket.on('leave-workspace', (workspaceId) => {
      socket.leave(`workspace-${workspaceId}`);
      console.log(`User ${socket.userId} left workspace ${workspaceId}`);
    });

    // Kanban Board Events
    socket.on('task-created', (data) => {
      socket.to(`workspace-${data.workspaceId}`).emit('task-created', data.task);
      
      // Create notifications for assignees
      if (data.task.assignees && data.task.assignees.length > 0) {
        data.task.assignees.forEach(async (assigneeId) => {
          if (assigneeId !== socket.userId) {
            await createNotification({
              recipient: assigneeId,
              sender: socket.userId,
              type: 'task_assigned',
              title: 'New Task Assigned',
              message: `You have been assigned to task: ${data.task.title}`,
              link: `/workspace/${data.workspaceId}/board/${data.task.board}`,
              data: { taskId: data.task._id },
            });
            
            socket.to(`user-${assigneeId}`).emit('notification', {
              type: 'task_assigned',
              task: data.task,
            });
          }
        });
      }
    });

    socket.on('task-updated', (data) => {
      socket.to(`workspace-${data.workspaceId}`).emit('task-updated', data.task);
      
      // Notify task assignees
      if (data.task.assignees) {
        data.task.assignees.forEach(async (assigneeId) => {
          if (assigneeId !== socket.userId) {
            await createNotification({
              recipient: assigneeId,
              sender: socket.userId,
              type: 'task_updated',
              title: 'Task Updated',
              message: `Task "${data.task.title}" has been updated`,
              link: `/workspace/${data.workspaceId}/board/${data.task.board}`,
              data: { taskId: data.task._id },
            });
          }
        });
      }
    });

    socket.on('task-deleted', (data) => {
      socket.to(`workspace-${data.workspaceId}`).emit('task-deleted', data.taskId);
    });

    socket.on('task-moved', (data) => {
      socket.to(`workspace-${data.workspaceId}`).emit('task-moved', data);
    });

    // Document Collaboration Events
    socket.on('document-join', (documentId) => {
      socket.join(`document-${documentId}`);
      socket.to(`document-${documentId}`).emit('user-joined', {
        userId: socket.userId,
        documentId,
      });
    });

    socket.on('document-leave', (documentId) => {
      socket.leave(`document-${documentId}`);
      socket.to(`document-${documentId}`).emit('user-left', {
        userId: socket.userId,
        documentId,
      });
    });

    socket.on('document-change', (data) => {
      socket.to(`document-${data.documentId}`).emit('document-change', {
        content: data.content,
        userId: socket.userId,
        timestamp: Date.now(),
      });
    });

    socket.on('document-cursor', (data) => {
      socket.to(`document-${data.documentId}`).emit('document-cursor', {
        userId: socket.userId,
        position: data.position,
      });
    });

    // Chat Events
    socket.on('chat-message', async (data) => {
      socket.to(`workspace-${data.workspaceId}`).emit('chat-message', data.message);
      
      // Notify mentioned users
      if (data.message.mentions && data.message.mentions.length > 0) {
        data.message.mentions.forEach(async (mentionedUserId) => {
          await createNotification({
            recipient: mentionedUserId,
            sender: socket.userId,
            type: 'mention',
            title: 'You were mentioned',
            message: `${data.senderName} mentioned you in a message`,
            link: `/workspace/${data.workspaceId}/chat`,
            data: { messageId: data.message._id },
          });
          
          socket.to(`user-${mentionedUserId}`).emit('notification', {
            type: 'mention',
            message: data.message,
          });
        });
      }
    });

    socket.on('typing', (data) => {
      socket.to(`workspace-${data.workspaceId}`).emit('typing', {
        userId: socket.userId,
        userName: data.userName,
        isTyping: data.isTyping,
      });
    });

    // Workspace Message Events
    socket.on('workspace-message', async (data) => {
      socket.to(`workspace-${data.workspaceId}`).emit('workspace-message', data.message);
    });

    socket.on('workspace-typing', (data) => {
      socket.to(`workspace-${data.workspaceId}`).emit('workspace-typing', {
        userId: socket.userId,
        userName: data.userName,
        isTyping: data.isTyping,
      });
    });

    // Comment Events
    socket.on('comment-added', async (data) => {
      socket.to(`workspace-${data.workspaceId}`).emit('comment-added', data.comment);
      
      // Notify mentioned users
      if (data.comment.mentions && data.comment.mentions.length > 0) {
        data.comment.mentions.forEach(async (mentionedUserId) => {
          await createNotification({
            recipient: mentionedUserId,
            sender: socket.userId,
            type: 'mention',
            title: 'You were mentioned',
            message: `${data.authorName} mentioned you in a comment`,
            link: `/workspace/${data.workspaceId}/task/${data.comment.task}`,
            data: { commentId: data.comment._id },
          });
        });
      }
    });

    // File Events
    socket.on('file-uploaded', async (data) => {
      socket.to(`workspace-${data.workspaceId}`).emit('file-uploaded', data.file);
      
      // Notify workspace members
      if (data.workspaceMembers) {
        data.workspaceMembers.forEach(async (memberId) => {
          if (memberId !== socket.userId) {
            await createNotification({
              recipient: memberId,
              sender: socket.userId,
              type: 'file_uploaded',
              title: 'New File Uploaded',
              message: `${data.uploaderName} uploaded ${data.file.name}`,
              link: `/workspace/${data.workspaceId}/files`,
              data: { fileId: data.file._id },
            });
          }
        });
      }
    });

    // Notification Events
    socket.on('notification', (data) => {
      socket.to(`user-${data.recipientId}`).emit('notification', data.notification);
    });

    // Team member management notifications
    socket.on('team-member-added', (data) => {
      socket.to(`user-${data.recipientId}`).emit('notification', data.notification);
    });

    socket.on('team-member-removed', (data) => {
      socket.to(`user-${data.recipientId}`).emit('notification', data.notification);
    });

    // Workspace and Board Events
    socket.on('workspace-updated', (data) => {
      socket.to(`workspace-${data.workspaceId}`).emit('workspace-updated', data);
    });

    socket.on('board-created', (data) => {
      socket.to(`workspace-${data.workspaceId}`).emit('board-created', data);
    });

    socket.on('member-added', (data) => {
      socket.to(`workspace-${data.workspaceId}`).emit('member-added', data);
      if (data.teamId) {
        socket.to(`team-${data.teamId}`).emit('member-added', data);
      }
    });

    socket.on('member-removed', (data) => {
      socket.to(`workspace-${data.workspaceId}`).emit('member-removed', data);
      if (data.teamId) {
        socket.to(`team-${data.teamId}`).emit('member-removed', data);
      }
    });

    // Join user's personal room for notifications
    socket.join(`user-${socket.userId}`);

    // Direct Message Events - handled via REST API now

    socket.on('direct-typing', (data) => {
      socket.to(`user-${data.receiverId}`).emit('direct-typing', {
        userId: socket.userId,
        userName: data.userName,
        isTyping: data.isTyping,
      });
    });

    // Handle message read status updates
    socket.on('message-read', async (data) => {
      const { messageId, readerId } = data;

      // Update message read status
      const message = await DirectMessage.findById(messageId);
      if (message && message.receiver.toString() === readerId) {
        const alreadyRead = message.readBy.some(read => read.user.toString() === readerId);
        if (!alreadyRead) {
          message.readBy.push({
            user: readerId,
            readAt: new Date(),
          });
          await message.save();

          // Delete notification for the reader
          await Notification.findOneAndDelete({
            recipient: readerId,
            type: 'direct_message',
            'data.messageId': messageId,
          });

          // Notify sender that message was read
          socket.to(`user-${message.sender}`).emit('message-read-update', {
            messageId,
            readerId,
          });

          // Emit notification deletion to the reader
          socket.to(`user-${readerId}`).emit('notification-deleted', {
            type: 'direct_message',
            messageId,
          });
        }
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);

      // Update user offline status
      User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date()
      }).then(() => {
        // Notify friends about offline status
        socket.broadcast.emit('user-offline', { userId: socket.userId });
      });
    });
  });
};

module.exports = setupSocketIO;
