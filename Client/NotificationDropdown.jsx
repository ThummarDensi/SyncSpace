import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../redux/slices/notificationSlice';
import { addNotificationRealtime } from '../redux/slices/notificationSlice';
import { acceptTeamInvite, declineTeamInvite, acceptTeamMemberInvite } from '../redux/slices/friendSlice';
import { getWorkspaces, acceptWorkspaceInvite, declineWorkspaceInvite } from '../redux/slices/workspaceSlice';
import socketService from '../services/socket';
import toast from 'react-hot-toast';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount } = useSelector((state) => state.notification);
  const dispatch = useDispatch();
  const dropdownRef = useRef(null);

  useEffect(() => {
    dispatch(getNotifications({ limit: 20 }));

    // Socket listener for real-time notifications
    socketService.onNotification((notification) => {
      dispatch(addNotificationRealtime(notification));
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = (id) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const handleAcceptInvite = async (notification) => {
    try {
      if (notification.type === 'team_workspace_invite') {
        // Accept team workspace invitation
        await dispatch(acceptWorkspaceInvite(notification.data.workspaceId)).unwrap();
        await dispatch(getWorkspaces()).unwrap(); // Refresh workspaces to show the new workspace
        await dispatch(deleteNotification(notification._id)).unwrap(); // Remove notification
        toast.success('Successfully joined the team workspace!');
      } else if (notification.type === 'team_invite') {
        // For regular team invitations
        await dispatch(acceptTeamInvite(notification.data.teamId)).unwrap();
        await dispatch(deleteNotification(notification._id)).unwrap(); // Remove notification
        toast.success('Successfully joined the team!');
      } else if (notification.type === 'team_member_invite') {
        // Accept team member invitation
        await dispatch(acceptTeamMemberInvite(notification.data.teamId)).unwrap();
        await dispatch(deleteNotification(notification._id)).unwrap(); // Remove notification
        toast.success('Successfully joined the team!');
      }
    } catch (error) {
      toast.error('Failed to join');
    }
  };

  const handleDeclineInvite = async (notification) => {
    try {
      if (notification.type === 'team_workspace_invite') {
        // Decline team workspace invitation - just remove notification
        await dispatch(deleteNotification(notification._id)).unwrap();
        toast.success('Team workspace invitation declined');
      } else if (notification.type === 'team_invite') {
        // For regular team invitations
        await dispatch(declineTeamInvite(notification.data.teamId)).unwrap();
        await dispatch(deleteNotification(notification._id)).unwrap();
        toast.success('Team invitation declined');
      } else if (notification.type === 'team_member_invite') {
        // Decline team member invitation - just remove notification
        await dispatch(deleteNotification(notification._id)).unwrap();
        toast.success('Team member invitation declined');
      }
    } catch (error) {
      toast.error('Failed to decline invitation');
    }
  };

  const handleNotificationClick = async (notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      await dispatch(markAsRead(notification._id)).unwrap();
    }

    // For certain notification types, remove them after clicking
    if (['team_member_added', 'team_member_removed', 'file_uploaded', 'direct_message'].includes(notification.type)) {
      await dispatch(deleteNotification(notification._id)).unwrap();
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'team_invite':
      case 'team_workspace_invite':
      case 'team_member_added':
      case 'team_member_removed':
        return '👥';
      case 'mention':
        return '💬';
      case 'task_assigned':
        return '📋';
      case 'comment':
        return '💭';
      case 'message':
        return '✉️';
      case 'invite':
        return '📨';
      case 'file_uploaded':
        return '📁';
      case 'direct_message':
        return '💬';
      default:
        return '🔔';
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'team_invite':
        return 'Team Invitation';
      case 'team_workspace_invite':
        return 'Workspace Invitation';
      case 'team_member_invite':
        return 'Team Member Invitation';
      case 'team_member_added':
        return 'Added to Team';
      case 'team_member_removed':
        return 'Removed from Team';
      case 'mention':
        return 'Mention';
      case 'task_assigned':
        return 'Task Assigned';
      case 'comment':
        return 'Comment';
      case 'message':
        return 'Message';
      case 'invite':
        return 'Invitation';
      case 'file_uploaded':
        return 'File Uploaded';
      case 'direct_message':
        return 'Direct Message';
      default:
        return 'Notification';
    }
  };

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <button
        className="notification-button"
        onClick={() => setIsOpen(!isOpen)}
        title={`${unreadCount} unread notifications`}
      >
        <span className="notification-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <div className="notification-header-content">
              <h3>Notifications</h3>
              <span className="notification-count">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </span>
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="btn-text">
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">📭</div>
                <h4>No notifications yet</h4>
                <p>You're all caught up! We'll notify you when something important happens.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon-wrapper">
                    <span className="notification-type-icon">
                      {getNotificationIcon(notification.type)}
                    </span>
                    {!notification.read && <div className="notification-dot"></div>}
                  </div>

                  <div className="notification-content">
                    <div className="notification-meta">
                      <span className="notification-type">
                        {getNotificationTypeLabel(notification.type)}
                      </span>
                      <span className="notification-time">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h4 className="notification-title">{notification.title}</h4>
                    <p className="notification-message">{notification.message}</p>

                    {(notification.type === 'team_invite' || notification.type === 'team_workspace_invite' || notification.type === 'team_member_invite') && (
                      <div className="notification-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcceptInvite(notification);
                          }}
                          className="btn btn-sm btn-success"
                          title="Accept invitation"
                        >
                          <span className="btn-icon">✓</span>
                          Accept
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeclineInvite(notification);
                          }}
                          className="btn btn-sm btn-danger"
                          title="Decline invitation"
                        >
                          <span className="btn-icon">✕</span>
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
