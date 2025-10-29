const Workspace = require('../models/Workspace');
const User = require('../models/User');

// @desc    Get all workspaces for user
// @route   GET /api/workspaces
// @access  Private
const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id },
      ],
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .populate('team', 'name')
      .sort('-createdAt');

    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get workspace by ID
// @route   GET /api/workspaces/:id
// @access  Private
const getWorkspaceById = async (req, res) => {
  try {
    const { password } = req.query;
    const workspace = await Workspace.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .populate('team', 'name description owner members.user members.role')
      .populate({
        path: 'team',
        populate: [
          {
            path: 'owner',
            select: 'name email avatar'
          },
          {
            path: 'members.user',
            select: 'name email avatar'
          }
        ]
      })
      .populate('boards')
      .populate('documents')
      .populate('files');

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // For team workspaces, verify password first for all non-owners
    if (workspace.type === 'team' && workspace.owner._id.toString() !== req.user._id.toString()) {
      if (!password || password !== workspace.password) {
        return res.status(403).json({ message: 'Invalid password' });
      }
    }

    // Check if user has access (owner, workspace member, or team member)
    const isOwner = workspace.owner._id.toString() === req.user._id.toString();
    const isWorkspaceMember = workspace.members.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );
    const isTeamMember = workspace.team && workspace.team.members && workspace.team.members.some(
      (member) => member.user._id.toString() === req.user._id.toString()
    );

    const hasAccess = isOwner || isWorkspaceMember || isTeamMember;

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new workspace
// @route   POST /api/workspaces
// @access  Private
const createWorkspace = async (req, res) => {
  try {
    const { name, description, type, password, memberIds, teamName } = req.body;

    if (type === 'team' && !password) {
      return res.status(400).json({ message: 'Password is required for team workspaces' });
    }

    const workspace = await Workspace.create({
      name,
      description,
      owner: req.user._id,
      type: type || 'personal',
      password: type === 'team' ? password : undefined,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    // If team workspace, send invitations but don't add members yet
    if (type === 'team' && memberIds && memberIds.length > 0) {
      const { createNotification } = require('./notificationController');

      for (const memberId of memberIds) {
        // Send team workspace invitation notification (members will be added only when accepted)
        await createNotification({
          recipient: memberId,
          sender: req.user._id,
          type: 'team_workspace_invite',
          title: 'Team Workspace Invitation',
          message: `${req.user.name} has invited you to join the workspace "${name}" in team "${teamName || 'Team'}"`,
          data: { workspaceId: workspace._id, teamName: teamName || name, inviterId: req.user._id },
        });
      }
      // Don't save workspace with members yet - they'll be added when invitations are accepted
    }

    // Add workspace to user's workspaces
    await User.findByIdAndUpdate(req.user._id, {
      $push: { workspaces: workspace._id },
    });

    const populatedWorkspace = await Workspace.findById(workspace._id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(201).json(populatedWorkspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update workspace
// @route   PUT /api/workspaces/:id
// @access  Private
const updateWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if user is owner or admin
    const isAdmin =
      workspace.owner.toString() === req.user._id.toString() ||
      workspace.members.some(
        (member) =>
          member.user.toString() === req.user._id.toString() &&
          member.role === 'admin'
      );

    if (!isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    workspace.name = req.body.name || workspace.name;
    workspace.description = req.body.description || workspace.description;

    const updatedWorkspace = await workspace.save();

    res.json(updatedWorkspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete workspace
// @route   DELETE /api/workspaces/:id
// @access  Private
const deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Only owner can delete
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get all member IDs before deleting
    const memberIds = workspace.members.map(member => member.user.toString());

    // Remove workspace from all members' workspaces
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { workspaces: workspace._id } }
    );

    // If workspace is linked to a team, remove it from the team's workspaces
    if (workspace.team) {
      await require('../models/Team').findByIdAndUpdate(workspace.team, {
        $pull: { workspaces: workspace._id }
      });
    }

    // Delete the workspace
    await workspace.deleteOne();

    // Emit socket event to notify all members that workspace was deleted
    try {
      const io = require('../utils/socket').getIO();
      memberIds.forEach(memberId => {
        io.to(memberId).emit('workspace-deleted', { workspaceId: workspace._id });
      });
    } catch (socketError) {
      console.error('Failed to emit workspace deletion socket event:', socketError);
      // Don't fail the operation if socket emission fails
    }

    res.json({ message: 'Workspace removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept team workspace invitation
// @route   POST /api/workspaces/:id/accept-invite
// @access  Private
const acceptWorkspaceInvite = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if user is already a member
    const isMember = workspace.members.some(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (isMember) {
      return res.status(400).json({ message: 'Already a member of this workspace' });
    }

    // Add user to workspace members
    workspace.members.push({ user: req.user._id, role: 'member', joinedAt: new Date() });
    await workspace.save();

    // Add workspace to user's workspaces
    await User.findByIdAndUpdate(req.user._id, {
      $push: { workspaces: workspace._id },
    });

    const updatedWorkspace = await Workspace.findById(workspace._id)
      .populate('members.user', 'name email avatar');

    res.json({ message: 'Successfully joined the workspace', workspace: updatedWorkspace });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Decline team workspace invitation
// @route   POST /api/workspaces/:id/decline-invite
// @access  Private
const declineWorkspaceInvite = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // For declining, we just return success - no changes needed to workspace
    res.json({ message: 'Workspace invitation declined' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add member to workspace
// @route   POST /api/workspaces/:id/members
// @access  Private
const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if requester is admin
    const isAdmin =
      workspace.owner.toString() === req.user._id.toString() ||
      workspace.members.some(
        (member) =>
          member.user.toString() === req.user._id.toString() &&
          member.role === 'admin'
      );

    if (!isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if user already a member
    const isMember = workspace.members.some(
      (member) => member.user.toString() === userId
    );

    if (isMember) {
      return res.status(400).json({ message: 'User already a member' });
    }

    workspace.members.push({ user: userId, role: role || 'member' });
    await workspace.save();

    // Add workspace to user's workspaces
    await User.findByIdAndUpdate(userId, {
      $push: { workspaces: workspace._id },
    });

    const updatedWorkspace = await Workspace.findById(workspace._id)
      .populate('members.user', 'name email avatar');

    res.json(updatedWorkspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove member from workspace
// @route   DELETE /api/workspaces/:id/members/:userId
// @access  Private
const removeMember = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);

    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }

    // Check if requester is admin
    const isAdmin =
      workspace.owner.toString() === req.user._id.toString() ||
      workspace.members.some(
        (member) =>
          member.user.toString() === req.user._id.toString() &&
          member.role === 'admin'
      );

    if (!isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    workspace.members = workspace.members.filter(
      (member) => member.user.toString() !== req.params.userId
    );

    await workspace.save();

    // Remove workspace from user's workspaces
    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { workspaces: workspace._id },
    });

    res.json({ message: 'Member removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  acceptWorkspaceInvite,
  declineWorkspaceInvite,
  addMember,
  removeMember,
};
