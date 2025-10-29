import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getDirectMessages, sendDirectMessage, addMessageRealtime, addTypingUser, removeTypingUser, markMessageAsRead } from '../redux/slices/directMessageSlice';
import { getFriends, updateFriendOnline, updateFriendOffline } from '../redux/slices/friendSlice';
import { removeNotification } from '../redux/slices/notificationSlice';
import socketService from '../services/socket';

const DirectChat = () => {
  const { friendId } = useParams();
  const dispatch = useDispatch();
  const { messages, loading, typingUsers } = useSelector((state) => state.directMessages);
  const { friends } = useSelector((state) => state.friends);
  const { user } = useSelector((state) => state.auth);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const friend = friends.find(f => f._id === friendId);

  useEffect(() => {
    if (friendId) {
      dispatch(getDirectMessages({ friendId }));
      dispatch(getFriends());
    }
  }, [friendId, dispatch]);

  useEffect(() => {
    // Listen for real-time messages
    socketService.socket?.on('direct-message', (message) => {
      if (message.sender._id === friendId || message.receiver._id === friendId) {
        // Check if message already exists to avoid duplicates
        dispatch(addMessageRealtime(message));

        // If this is a message sent to us, mark it as read
        if (message.receiver._id === user._id) {
          // Mark as read when we receive it
          dispatch(markMessageAsRead(message._id));
        }
      }
    });

    // Listen for typing indicators
    socketService.socket?.on('direct-typing', (data) => {
      if (data.userId === friendId) {
        dispatch(addTypingUser(data));
        setTimeout(() => dispatch(removeTypingUser(data.userId)), 3000);
      }
    });

    // Listen for message read updates
    socketService.socket?.on('message-read-update', (data) => {
      if (data.readerId === friendId) {
        // Update the message read status in the store
        dispatch({
          type: 'directMessages/messageReadUpdate',
          payload: data,
        });
      }
    });

    // Listen for notification deletions
    socketService.socket?.on('notification-deleted', (data) => {
      if (data.type === 'direct_message') {
        dispatch(removeNotification(data));
      }
    });

    // Listen for friend online/offline status
    socketService.socket?.on('user-online', (data) => {
      dispatch(updateFriendOnline(data));
    });

    socketService.socket?.on('user-offline', (data) => {
      dispatch(updateFriendOffline(data));
    });

    return () => {
      socketService.socket?.off('direct-message');
      socketService.socket?.off('direct-typing');
      socketService.socket?.off('message-read-update');
      socketService.socket?.off('notification-deleted');
      socketService.socket?.off('user-online');
      socketService.socket?.off('user-offline');
    };
  }, [friendId, dispatch, user._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() && friendId) {
      await dispatch(sendDirectMessage({
        content: newMessage,
        receiverId: friendId,
      }));
      setNewMessage('');
      setIsTyping(false);
      socketService.socket?.emit('direct-typing', {
        receiverId: friendId,
        userName: user.name,
        isTyping: false,
      });
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socketService.socket?.emit('direct-typing', {
        receiverId: friendId,
        userName: user.name,
        isTyping: true,
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketService.socket?.emit('direct-typing', {
        receiverId: friendId,
        userName: user.name,
        isTyping: false,
      });
    }, 2000);
  };

  if (!friend) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="direct-chat-page">
      <div className="chat-container">
        {/* Chat Header */}
        <div className="chat-header">
          <div className="friend-info">
            <div className="user-avatar">
              {friend.avatar ? (
                <img src={friend.avatar} alt={friend.name} />
              ) : (
                <span>{friend.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <div className="font-semibold">{friend.name}</div>
              <div className="text-secondary text-sm">
                {friend.isOnline ? (
                  <span className="text-success">● Online</span>
                ) : (
                  <span>Last seen {new Date(friend.lastSeen).toLocaleString()}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-container">
          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`message ${message.sender._id === user._id ? 'message-own' : 'message-other'}`}
                >
                  <div className="message-content">
                    <p>{message.content}</p>
                    <div className="message-meta">
                      <span className="message-time">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </span>
                      {message.sender._id === user._id && (
                        <div className="message-status">
                          {message.readBy && message.readBy.some(read => read.user === friendId) ? (
                            <span className="status-read">✓✓</span>
                          ) : message.deliveredTo && message.deliveredTo.some(delivered => delivered.user === friendId) ? (
                            friend?.isOnline ? (
                              <span className="status-delivered-double">✓✓</span>
                            ) : (
                              <span className="status-delivered">✓</span>
                            )
                          ) : (
                            <span className="status-sent">○</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {typingUsers.some(u => u.userId === friendId) && (
                <div className="typing-indicator">
                  <span>{friend.name} is typing...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="message-form">
          <input
            type="text"
            className="form-input message-input"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={!newMessage.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default DirectChat;
