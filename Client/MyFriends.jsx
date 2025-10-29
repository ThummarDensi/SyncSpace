import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getFriends } from '../redux/slices/friendSlice';
import socketService from '../services/socket';

const MyFriends = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { friends, loading } = useSelector((state) => state.friends);
  const { user } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(getFriends());

    // Listen for friend status updates
    socketService.socket?.on('user-online', (data) => {
      dispatch({ type: 'friends/updateFriendStatus', payload: { userId: data.userId, isOnline: true } });
    });

    socketService.socket?.on('user-offline', (data) => {
      dispatch({ type: 'friends/updateFriendStatus', payload: { userId: data.userId, isOnline: false } });
    });

    return () => {
      socketService.socket?.off('user-online');
      socketService.socket?.off('user-offline');
    };
  }, [dispatch]);

  const handleMessageFriend = (friendId) => {
    navigate(`/chat/${friendId}`);
  };

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="friends-page">
      <div className="container">
        <h1>My Friends</h1>

        <div className="friends-grid">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">My Friends ({friends.length})</h3>
              <input
                type="text"
                className="form-input"
                placeholder="Search friends..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="card-body">
              {filteredFriends.length === 0 ? (
                <p className="text-secondary">No friends yet. Add some friends to get started!</p>
              ) : (
                <div className="friends-list">
                  {filteredFriends.map((friend) => (
                    <div key={friend._id} className="friend-item">
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
                      <button
                        onClick={() => handleMessageFriend(friend._id)}
                        className="btn btn-primary btn-sm"
                      >
                        Message
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyFriends;
