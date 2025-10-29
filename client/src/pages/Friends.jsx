import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getFriends, getFriendRequests, acceptFriendRequest, rejectFriendRequest, sendFriendRequest } from '../redux/slices/friendSlice';
import socketService from '../services/socket';

const Friends = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { friends, friendRequests, loading } = useSelector((state) => state.friends);
  const { user } = useSelector((state) => state.auth);

  const [friendEmail, setFriendEmail] = useState('');

  useEffect(() => {
    dispatch(getFriends());
    dispatch(getFriendRequests());

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

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (friendEmail.trim()) {
      try {
        await dispatch(sendFriendRequest(friendEmail));
        setFriendEmail('');
        dispatch(getFriendRequests());
      } catch (error) {
        console.error('Error sending friend request:', error);
      }
    }
  };



  const handleAcceptRequest = async (requestId) => {
    await dispatch(acceptFriendRequest(requestId));
    dispatch(getFriends());
  };

  const handleRejectRequest = async (requestId) => {
    await dispatch(rejectFriendRequest(requestId));
  };





  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div className="friends-page">
      <div className="container">
        <h1>Friend Requests</h1>

        <div className="friends-grid">
          {/* Add Friend Section */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Add Friend</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSendRequest}>
                <div className="form-group">
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Enter friend's email"
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Send Friend Request
                </button>
              </form>
            </div>
          </div>

          {/* Friend Requests */}
          {friendRequests.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Friend Requests ({friendRequests.length})</h3>
              </div>
              <div className="card-body">
                {friendRequests.map((request) => (
                  <div key={request._id} className="friend-request">
                    <div className="friend-info">
                      <div className="user-avatar">
                        {request.from.avatar ? (
                          <img src={request.from.avatar} alt={request.from.name} />
                        ) : (
                          <span>{request.from.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{request.from.name}</div>
                        <div className="text-secondary text-sm">{request.from.email}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(request._id)}
                        className="btn btn-success btn-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request._id)}
                        className="btn btn-danger btn-sm"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
};

export default Friends;
