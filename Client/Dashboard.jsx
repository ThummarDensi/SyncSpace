import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getWorkspaces, createWorkspace } from '../redux/slices/workspaceSlice';
import { setCurrentWorkspace } from '../redux/slices/workspaceSlice';
import { getFriends } from '../redux/slices/friendSlice';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const [showModal, setShowModal] = useState(false);
  const [workspaceType, setWorkspaceType] = useState(''); // 'personal' or 'team'
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [workspacePassword, setWorkspacePassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [createWorkspaceLoading, setCreateWorkspaceLoading] = useState(false);

  const { workspaces, loading } = useSelector((state) => state.workspace);
  const { friends } = useSelector((state) => state.friends);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getWorkspaces());
    dispatch(getFriends());
  }, [dispatch]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();

    if (!workspaceName.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    if (!workspaceType) {
      toast.error('Please select workspace type');
      return;
    }

    if (workspaceType === 'team') {
      if (!teamName.trim()) {
        toast.error('Team name is required for team workspaces');
        return;
      }
      if (selectedMembers.length === 0) {
        toast.error('Please select at least one team member');
        return;
      }
      if (!workspacePassword.trim()) {
        toast.error('Password is required for team workspaces');
        return;
      }
    }

    try {
      setCreateWorkspaceLoading(true);
      const workspaceData = {
        name: workspaceName,
        description: workspaceDescription,
        type: workspaceType,
      };

      if (workspaceType === 'team') {
        workspaceData.teamName = teamName;
        workspaceData.password = workspacePassword;
        workspaceData.memberIds = selectedMembers;
      }

      const result = await dispatch(createWorkspace(workspaceData)).unwrap();

      toast.success('Workspace created successfully');
      resetModal();
      navigate(`/workspace/${result._id}`);
    } catch (error) {
      toast.error(error || 'Failed to create workspace');
    } finally {
      setCreateWorkspaceLoading(false);
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setWorkspaceType('');
    setWorkspaceName('');
    setWorkspaceDescription('');
    setSelectedMembers([]);
    setWorkspacePassword('');
    setTeamName('');
  };

  const handleMemberToggle = (friendId) => {
    setSelectedMembers(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleWorkspaceClick = async (workspace) => {
    // For team workspaces, check if user is owner or has access
    if (workspace.type === 'team' && workspace.owner._id !== user._id) {
      // Check if user is a member
      const isMember = workspace.members.some(member => member.user._id === user._id);
      if (!isMember) {
        toast.error('You do not have access to this workspace');
        return;
      }
    }

    dispatch(setCurrentWorkspace(workspace));
    navigate(`/workspace/${workspace._id}`);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.name}!</h1>
          <p className="text-secondary">Manage your workspaces and projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Create Workspace
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="workspaces-grid">
          {workspaces.length === 0 ? (
            <div className="empty-state">
              <h3>No workspaces yet</h3>
              <p>Create your first workspace to get started</p>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                Create Workspace
              </button>
            </div>
          ) : (
            workspaces.map((workspace) => (
              <div
                key={workspace._id}
                className="workspace-card"
                onClick={() => handleWorkspaceClick(workspace)}
              >
                <div className="workspace-icon">📊</div>
                <div className="workspace-info">
                  <h3>{workspace.name}</h3>
                  <p>{workspace.description || 'No description'}</p>
                  <div className="workspace-meta">
                    <span className="badge badge-primary">
                      {workspace.members?.length || 0} members
                    </span>
                    <span className="badge badge-success">
                      {workspace.boards?.length || 0} boards
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => resetModal()}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Workspace</h2>
              <button className="modal-close" onClick={() => resetModal()}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateWorkspace}>
              <div className="modal-body">
                {!workspaceType ? (
                  <div className="workspace-type-selection">
                    <h3>Choose Workspace Type</h3>
                    <div className="type-options">
                      <div
                        className="type-option"
                        onClick={() => setWorkspaceType('personal')}
                      >
                        <div className="type-icon">👤</div>
                        <h4>Personal</h4>
                        <p>Create a private workspace for yourself</p>
                      </div>
                      <div
                        className="type-option"
                        onClick={() => setWorkspaceType('team')}
                      >
                        <div className="type-icon">👥</div>
                        <h4>Team</h4>
                        <p>Collaborate with friends on shared projects</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">Workspace Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        placeholder="My Awesome Project"
                        autoFocus
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description (optional)</label>
                      <textarea
                        className="form-textarea"
                        value={workspaceDescription}
                        onChange={(e) => setWorkspaceDescription(e.target.value)}
                        placeholder="What's this workspace about?"
                      ></textarea>
                    </div>

                    {workspaceType === 'team' && (
                      <>
                        <div className="form-group">
                          <label className="form-label">Team Name</label>
                          <input
                            type="text"
                            className="form-input"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Enter team name"
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Choose Team Members</label>
                          <div className="friends-selection">
                            {friends.length === 0 ? (
                              <p className="text-secondary">No friends available. Add friends first.</p>
                            ) : (
                              friends.map((friend) => (
                                <div
                                  key={friend._id}
                                  className={`friend-item ${selectedMembers.includes(friend._id) ? 'selected' : ''}`}
                                  onClick={() => handleMemberToggle(friend._id)}
                                >
                                  <div className="friend-avatar">
                                    {friend.avatar ? (
                                      <img src={friend.avatar} alt={friend.name} />
                                    ) : (
                                      <span>{friend.name.charAt(0).toUpperCase()}</span>
                                    )}
                                  </div>
                                  <span>{friend.name}</span>
                                  {selectedMembers.includes(friend._id) && (
                                    <span className="checkmark">✓</span>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Workspace Password</label>
                          <input
                            type="password"
                            className="form-input"
                            value={workspacePassword}
                            onChange={(e) => setWorkspacePassword(e.target.value)}
                            placeholder="Enter a secure password"
                          />
                          <small className="form-help">This password will be required for all team members to access the workspace</small>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => workspaceType ? setWorkspaceType('') : resetModal()}
                >
                  {workspaceType ? 'Back' : 'Cancel'}
                </button>
                {workspaceType && (
                  <button type="submit" className="btn btn-primary" disabled={createWorkspaceLoading}>
                    {createWorkspaceLoading ? 'Creating...' : `Create ${workspaceType === 'personal' ? 'Personal' : 'Team'} Workspace`}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
