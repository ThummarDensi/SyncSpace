import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  getWorkspaceMessages,
  sendWorkspaceMessage,
  addWorkspaceMessageRealtime,
  clearWorkspaceMessages,
} from '../redux/slices/workspaceMessageSlice';
import { getWorkspaceById } from '../redux/slices/workspaceSlice';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import './Chat.css';

const Chat = () => {
  const { workspaceId } = useParams();
  const dispatch = useDispatch();
  const { messages, loading } = useSelector((state) => state.workspaceMessages);
  const { currentWorkspace } = useSelector((state) => state.workspace);
  const { user } = useSelector((state) => state.auth);

  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (workspaceId) {
      // Load workspace details
      dispatch(getWorkspaceById(workspaceId));
      // Load messages
      dispatch(getWorkspaceMessages({ workspaceId }));

      // Set up socket listeners for workspace messages
      if (socketService.socket) {
        socketService.onWorkspaceMessage((data) => {
          if (data.workspaceId === workspaceId) {
            dispatch(addWorkspaceMessageRealtime(data));
          }
        });
      }
    }

    return () => {
      // Clean up
      dispatch(clearWorkspaceMessages());
      if (socketService.socket) {
        socketService.socket.off('workspace-message');
      }
    };
  }, [workspaceId, dispatch]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    try {
      await dispatch(sendWorkspaceMessage({
        workspaceId,
        content: messageInput.trim(),
      })).unwrap();

      setMessageInput('');
      setIsTyping(false);

      // Clear typing indicator
      if (socketService.socket) {
        socketService.socket.emit('stop-typing', { workspaceId, userId: user._id });
      }
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleInputChange = (e) => {
    setMessageInput(e.target.value);

    // Handle typing indicator
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      if (socketService.socket) {
        socketService.socket.emit('start-typing', { workspaceId, userId: user._id, userName: user.name });
      }
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socketService.socket) {
        socketService.socket.emit('stop-typing', { workspaceId, userId: user._id });
      }
    }, 1000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && (!Array.isArray(messages) || messages.length === 0)) {
    return (
      <div className="chat-page">
        <div className="chat-container">
          <div className="chat-header">
            <h1>{currentWorkspace?.name || 'Workspace'} Chat</h1>
          </div>
          <div className="chat-messages">
            <div className="loading">Loading messages...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-container">
        <div className="chat-header">
          <h1>{currentWorkspace?.name || 'Workspace'} Chat</h1>
          <p className="chat-subtitle">
            Real-time messaging for {currentWorkspace?.members?.length || 0} members
          </p>
        </div>

        <div className="chat-messages">
          {Array.isArray(messages) && messages.length === 0 ? (
            <div className="no-messages">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            Array.isArray(messages) && messages.map((message) => (
              <div
                key={message._id}
                className={`message ${message.sender._id === user._id ? 'own' : ''}`}
              >
                <div className="message-avatar">
                  {message.sender.avatar ? (
                    <img src={message.sender.avatar} alt={message.sender.name} />
                  ) : (
                    <span>{message.sender.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-sender">{message.sender.name}</span>
                    <span className="message-time">{formatTime(message.createdAt)}</span>
                  </div>
                  <div className="message-text">{message.content}</div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <div className="chat-input-container">
            <input
              type="text"
              className="chat-input"
              placeholder="Type a message..."
              value={messageInput}
              onChange={handleInputChange}
              maxLength={500}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!messageInput.trim() || loading}
            >
              {loading ? '...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;
