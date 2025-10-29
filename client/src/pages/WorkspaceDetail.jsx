import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getWorkspaceById, getWorkspaceByIdWithPassword, addMember, deleteWorkspace } from '../redux/slices/workspaceSlice';
import socketService from '../services/socket';
import { getBoards, createBoard } from '../redux/slices/boardSlice';
import { getDocuments } from '../redux/slices/documentSlice';
import { getFriends, addMemberToTeam, removeMemberFromTeam, generateTeamInviteLink } from '../redux/slices/friendSlice';
import toast from 'react-hot-toast';
import './WorkspaceDetail.css';

const WorkspaceDetail = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentWorkspace, loading } = useSelector((state) => state.workspace);
  const { boards } = useSelector((state) => state.board);
  const { documents } = useSelector((state) => state.document);
  const { friends } = useSelector((state) => state.friends);
  const { user } = useSelector((state) => state.auth);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [isAccessGranted, setIsAccessGranted] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [showInviteLinkModal, setShowInviteLinkModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteExpiresAt, setInviteExpiresAt] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [removeMemberLoading, setRemoveMemberLoading] = useState(false);
  const [createBoardLoading, setCreateBoardLoading] = useState(false);
  const [deleteWorkspaceLoading, setDeleteWorkspaceLoading] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      loadWorkspace();
      dispatch(getFriends());
    }
  }, [workspaceId, dispatch]);

  // Listen for workspace deletion events
  useEffect(() => {
    const handleWorkspaceDeleted = (data) => {
      if (data.workspaceId === workspaceId) {
        toast.error('This workspace has been deleted');
        navigate('/dashboard');
      }
    };

    const handleWorkspaceUpdated = (data) => {
      if (data.workspaceId === workspaceId) {
        // Refresh workspace data when workspace is updated
        loadWorkspace();
      }
    };

    const handleBoardCreated = (data) => {
      if (data.workspaceId === workspaceId) {
        // Refresh boards when a new board is created
        dispatch(getBoards(workspaceId));
        loadWorkspace();
      }
    };

    const handleMemberAdded = (data) => {
      if (data.workspaceId === workspaceId || data.teamId === currentWorkspace?.team?._id) {
        // Refresh workspace data when members are added
        loadWorkspace();
      }
    };

    const handleMemberRemoved = (data) => {
      if (data.teamId === currentWorkspace?.team?._id) {
        // Refresh workspace data when members are removed
        loadWorkspace();
      }
    };

    if (socketService.socket) {
      socketService.onWorkspaceDeleted(handleWorkspaceDeleted);
      socketService.onWorkspaceUpdated(handleWorkspaceUpdated);
      socketService.onBoardCreated(handleBoardCreated);
      socketService.onMemberAdded(handleMemberAdded);
      socketService.onMemberRemoved(handleMemberRemoved);
    }

    return () => {
      if (socketService.socket) {
        socketService.socket.off('workspace-deleted', handleWorkspaceDeleted);
        socketService.socket.off('workspace-updated', handleWorkspaceUpdated);
        socketService.socket.off('board-created', handleBoardCreated);
        socketService.socket.off('member-added', handleMemberAdded);
        socketService.socket.off('member-removed', handleMemberRemoved);
      }
    };
  }, [workspaceId, navigate, dispatch, currentWorkspace?.team?._id]);

  const loadWorkspace = async () => {
    try {
      setActionLoading(true);
      // First try to load without password
      const result = await dispatch(getWorkspaceById(workspaceId)).unwrap();
      setIsAccessGranted(true);
      dispatch(getBoards(workspaceId));
      dispatch(getDocuments(workspaceId));
    } catch (error) {
      // If access denied, show password modal for team workspaces
      if (error === 'Invalid password' || error === 'Access denied') {
        setShowPasswordModal(true);
      } else {
        toast.error('Failed to load workspace');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await dispatch(getWorkspaceByIdWithPassword({ id: workspaceId, password })).unwrap();
      setIsAccessGranted(true);
      setShowPasswordModal(false);
      setPassword('');
      dispatch(getBoards(workspaceId));
      dispatch(getDocuments(workspaceId));
      toast.success('Access granted');
    } catch (error) {
      toast.error('Invalid password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (selectedFriends.length === 0) {
      toast.error('Please select at least one friend');
      return;
    }

    // For team workspaces, use team ID; for personal workspaces, use workspace ID
    const targetId = currentWorkspace?.team?._id || currentWorkspace?._id;
    const apiEndpoint = currentWorkspace?.team ? 'teams' : 'workspaces';

    if (!targetId) {
      toast.error('Unable to determine target for adding members');
      return;
    }

    try {
      setAddMemberLoading(true);
      for (const friendId of selectedFriends) {
        if (apiEndpoint === 'teams') {
          await dispatch(addMemberToTeam({ teamId: targetId, memberId: friendId })).unwrap();
        } else {
          // For personal workspaces, use the existing addMember action
          await dispatch(addMember({ workspaceId: targetId, userId: friendId })).unwrap();
        }
      }
      toast.success('Members added successfully');
      setShowAddMemberModal(false);
      setSelectedFriends([]);
      // Refresh workspace data to show updated members immediately
      await loadWorkspace();
    } catch (error) {
      console.error('Error adding members:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to add members');
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleFriendToggle = (friendId) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleRemoveMember = async (memberId) => {
    if (!currentWorkspace?.team?._id) {
      toast.error('Cannot remove member from personal workspace');
      return;
    }

    try {
      setRemoveMemberLoading(true);
      await dispatch(removeMemberFromTeam({ teamId: currentWorkspace.team._id, memberId })).unwrap();
      toast.success('Member removed successfully');
      // Refresh workspace data to show updated members immediately
      await loadWorkspace();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to remove member');
    } finally {
      setRemoveMemberLoading(false);
    }
  };

  const handleGenerateInviteLink = async () => {
    if (!currentWorkspace?.team?._id) {
      toast.error('Cannot generate invite link for personal workspace');
      return;
    }

    try {
      const result = await dispatch(generateTeamInviteLink(currentWorkspace.team._id)).unwrap();
      setInviteLink(result.inviteLink);
      setInviteExpiresAt(result.expiresAt);
      setShowInviteLinkModal(true);
      toast.success('Invite link generated successfully');
    } catch (error) {
      console.error('Error generating invite link:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to generate invite link');
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Invite link copied to clipboard');
  };

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) return;

    try {
      setDeleteWorkspaceLoading(true);
      const result = await dispatch(deleteWorkspace(currentWorkspace._id)).unwrap();
      toast.success(result.message || 'Workspace deleted successfully');
      setShowDeleteModal(false);
      // Navigate back to dashboard using React Router
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting workspace:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to delete workspace');
    } finally {
      setDeleteWorkspaceLoading(false);
    }
  };

  const handleCreateBoard = async (e) => {
    e.preventDefault();

    if (!boardName.trim()) {
      toast.error('Board name is required');
      return;
    }

    try {
      setCreateBoardLoading(true);
      await dispatch(createBoard({
        name: boardName,
        description: boardDescription,
        workspaceId: currentWorkspace._id,
      })).unwrap();

      toast.success('Board created successfully');
      setShowCreateBoardModal(false);
      setBoardName('');
      setBoardDescription('');
      // Refresh both boards and workspace data to update UI immediately
      dispatch(getBoards(currentWorkspace._id));
      loadWorkspace(); // This will refresh the workspace data including the boards array
    } catch (error) {
      console.error('Error creating board:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to create board');
    } finally {
      setCreateBoardLoading(false);
    }
  };

  // Check if current user is admin or owner of the team
  const isTeamAdmin = currentWorkspace?.team?.members?.some(
    member => member.user._id === user._id && (member.role === 'admin' || member.role === 'owner')
  ) || currentWorkspace?.team?.owner?.toString() === user._id?.toString() ||
  (currentWorkspace.type === 'team' && currentWorkspace.owner._id === user._id);

  // Check if current user is the owner of the workspace
  const isWorkspaceOwner = currentWorkspace?.owner?._id === user._id;

  // For team workspaces, show team members; for personal workspaces, show workspace members
  const displayMembers = currentWorkspace?.team?.members || currentWorkspace?.members || [];

  // Get friends not already in the team/workspace
  const availableFriends = friends.filter(friend =>
    !displayMembers?.some(member => member.user._id === friend._id)
  );

  // Debug logs - remove after testing
  // console.log('Current workspace:', currentWorkspace);
  // console.log('Team:', currentWorkspace?.team);
  // console.log('Display members:', displayMembers);
  // console.log('User ID:', user?._id);
  // console.log('Is team admin:', isTeamAdmin);
  // console.log('Available friends:', availableFriends);

  if (loading || actionLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading workspace...</p>
      </div>
    );
  }

  if (showPasswordModal) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <h2 className="modal-title">Enter Workspace Password</h2>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter workspace password"
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary">
                Access Workspace
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-detail">
      <div className="workspace-detail-header">
        <div className="header-content">
          <div>
            <h1>{currentWorkspace?.name}</h1>
            <p className="text-secondary">{currentWorkspace?.description}</p>
          </div>
          {isWorkspaceOwner && (
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setShowDeleteModal(true)}
              title="Delete Workspace"
            >
              🗑️ Delete Workspace
            </button>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{currentWorkspace?.members?.length || 0}</h3>
            <p>Members</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>{boards?.length || 0}</h3>
            <p>Boards</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-info">
            <h3>{documents?.length || 0}</h3>
            <p>Documents</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📁</div>
          <div className="stat-info">
            <h3>{currentWorkspace?.files?.length || 0}</h3>
            <p>Files</p>
          </div>
        </div>
      </div>

      <div className="workspace-sections">
        <section className="workspace-section">
          <div className="section-header">
            <h2>Boards</h2>
            {isTeamAdmin && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowCreateBoardModal(true)}
                  disabled={createBoardLoading}
                >
                  {createBoardLoading ? 'Creating...' : '+ Create Board'}
                </button>
            )}
          </div>
          <div className="items-list">
            {boards && boards.length > 0 ? (
              boards.map((board) => (
                <div key={board._id} className="item-card">
                  <span className="item-icon">📋</span>
                  <div>
                    <h4>{board.name}</h4>
                    <p className="text-sm text-secondary">{board.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-secondary">No boards yet</p>
            )}
          </div>
        </section>

        <section className="workspace-section">
          <h2>Recent Documents</h2>
          <div className="items-list">
            {documents && documents.length > 0 ? (
              documents.slice(0, 3).map((doc) => (
                <div key={doc._id} className="item-card">
                  <span className="item-icon">📄</span>
                  <div>
                    <h4>{doc.title}</h4>
                    <p className="text-sm text-secondary">
                      Last edited by {doc.lastEditedBy?.name || 'Unknown'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-secondary">No documents yet</p>
            )}
          </div>
        </section>

        <section className="workspace-section">
          <div className="section-header">
            <h2>Team Members</h2>
            {isTeamAdmin && (
              <div className="section-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleGenerateInviteLink}
                  title="Generate invite link"
                >
                  🔗 Invite Link
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAddMemberModal(true)}
                  disabled={addMemberLoading}
                >
                  {addMemberLoading ? 'Adding...' : '+ Add Member'}
                </button>
              </div>
            )}
          </div>
          <div className="members-list">
            {displayMembers?.length > 0 ? (
              displayMembers.map((member) => (
                <div key={member.user._id} className="member-item">
                  <div className="member-avatar">
                    {member.user.avatar ? (
                      <img src={member.user.avatar} alt={member.user.name} />
                    ) : (
                      <span>{member.user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="member-info">
                    <h4>{member.user.name}</h4>
                    <p className="text-sm text-secondary">{member.role}</p>
                  </div>
                  {currentWorkspace?.team && isTeamAdmin && member.role !== 'admin' && member.user._id !== user._id && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveMember(member.user._id)}
                      disabled={removeMemberLoading}
                    >
                      {removeMemberLoading ? 'Removing...' : 'Remove'}
                    </button>
                  )}
                </div>
              ))
            ) : (
              <p className="text-secondary">No members found</p>
            )}
          </div>
        </section>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="modal-overlay" onClick={() => setShowAddMemberModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Team Members</h2>
              <button
                className="modal-close"
                onClick={() => setShowAddMemberModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddMember}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Friends to Add</label>
                  <div className="friends-selection">
                    {availableFriends.length === 0 ? (
                      <p className="text-secondary">
                        No available friends to add. All your friends are already in the team.
                      </p>
                    ) : (
                      availableFriends.map((friend) => (
                        <div
                          key={friend._id}
                          className={`friend-item ${selectedFriends.includes(friend._id) ? 'selected' : ''}`}
                          onClick={() => handleFriendToggle(friend._id)}
                        >
                          <div className="friend-avatar">
                            {friend.avatar ? (
                              <img src={friend.avatar} alt={friend.name} />
                            ) : (
                              <span>{friend.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <span>{friend.name}</span>
                          {selectedFriends.includes(friend._id) && (
                            <span className="checkmark">✓</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddMemberModal(false)}
                >
                  Cancel
                </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={selectedFriends.length === 0 || addMemberLoading}
              >
                {addMemberLoading ? 'Adding Members...' : `Add Members (${selectedFriends.length})`}
              </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Link Modal */}
      {showInviteLinkModal && (
        <div className="modal-overlay" onClick={() => setShowInviteLinkModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Team Invite Link</h2>
              <button
                className="modal-close"
                onClick={() => setShowInviteLinkModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Invite Link</label>
                <div className="invite-link-container">
                  <input
                    type="text"
                    className="form-input"
                    value={inviteLink}
                    readOnly
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={copyInviteLink}
                    title="Copy to clipboard"
                  >
                    📋 Copy
                  </button>
                </div>
                {inviteExpiresAt && (
                  <p className="text-sm text-secondary">
                    Expires on: {new Date(inviteExpiresAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="invite-info">
                <p className="text-sm">
                  Share this link with anyone you want to invite to the team.
                  The link will expire in 24 hours.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowInviteLinkModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Board Modal */}
      {showCreateBoardModal && (
        <div className="modal-overlay" onClick={() => setShowCreateBoardModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Board</h2>
              <button
                className="modal-close"
                onClick={() => setShowCreateBoardModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateBoard}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Board Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    placeholder="Enter board name"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <textarea
                    className="form-textarea"
                    value={boardDescription}
                    onChange={(e) => setBoardDescription(e.target.value)}
                    placeholder="What's this board about?"
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateBoardModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createBoardLoading}>
                  {createBoardLoading ? 'Creating Board...' : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Workspace Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Workspace</h2>
              <button
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="delete-warning">
                <div className="warning-icon">⚠️</div>
                <h3>Are you sure you want to delete this workspace?</h3>
                <p className="text-danger">
                  This action cannot be undone. This will permanently delete the workspace
                  "{currentWorkspace?.name}" and remove all members from it.
                </p>
                <div className="delete-details">
                  <p><strong>What will happen:</strong></p>
                  <ul>
                    <li>The workspace will be completely removed</li>
                    <li>All members will be removed from the workspace</li>
                    <li>All associated boards, documents, and files will be deleted</li>
                    <li>Members will no longer see this workspace in their dashboard</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteWorkspace}
                disabled={deleteWorkspaceLoading}
              >
                {deleteWorkspaceLoading ? 'Deleting...' : 'Delete Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceDetail;
