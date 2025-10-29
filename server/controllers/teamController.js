const Team = require('../models/Team');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const { createNotification } = require('./notificationController');

// @desc    Create new team
// @route   POST /api/teams
// @access  Private
const createTeam = async (req, res) => {
  try {
    const { name, description, memberIds, workspaceId } = req.body;

    // Create team
    const team = await Team.create({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }],
    });

    // Add members to team
    if (memberIds && memberIds.length > 0) {
      for (const memberId of memberIds) {
        team.members.push({ user: memberId, role: 'member' });

        // Send notification to each member
        await createNotification({
          recipient: memberId,
          sender: req.user._id,
          type: 'team_invite',
          title: 'Team Invitation',
          message: `You have been invited to join the team "${name}"`,
          data: { teamId: team._id },
        });
      }
    }

    // If workspaceId is provided, link the workspace to the team
    if (workspaceId) {
      team.workspaces.push(workspaceId);
      await Workspace.findByIdAndUpdate(workspaceId, {
        $set: { team: team._id },
      });

      // Send workspace invitation notifications to team members
      for (const memberId of memberIds) {
        await createNotification({
          recipient: memberId,
          sender: req.user._id,
          type: 'team_workspace_invite',
          title: 'Workspace Invitation',
          message: `You have been invited to join the workspace "${await Workspace.findById(workspaceId).then(w => w.name)}" in team "${name}"`,
          data: { workspaceId, teamId: team._id },
        });
      }
    }

    await team.save();

    // Add team to owner's teams
    await User.findByIdAndUpdate(req.user._id, {
      $push: { teams: team._id },
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('members.user', 'name email avatar');

    res.status(201).json(populatedTeam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get teams for user
// @route   GET /api/teams
// @access  Private
const getTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      'members.user': req.user._id,
    })
      .populate('members.user', 'name email avatar')
      .populate('owner', 'name email avatar')
      .sort('-createdAt');

    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept team invitation
// @route   PUT /api/teams/:id/accept
// @access  Private
const acceptTeamInvite = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is invited
    const memberIndex = team.members.findIndex(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (memberIndex === -1) {
      return res.status(403).json({ message: 'Not invited to this team' });
    }

    // Update member status
    team.members[memberIndex].joinedAt = new Date();
    await team.save();

    // Add team to user's teams
    await User.findByIdAndUpdate(req.user._id, {
      $push: { teams: team._id },
    });

    res.json({ message: 'Successfully joined the team' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Decline team invitation
// @route   PUT /api/teams/:id/decline
// @access  Private
const declineTeamInvite = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Remove user from team members
    team.members = team.members.filter(
      (member) => member.user.toString() !== req.user._id.toString()
    );

    await team.save();

    res.json({ message: 'Team invitation declined' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add member to team
// @route   POST /api/teams/:id/members
// @access  Private (Team admin only)
const addMemberToTeam = async (req, res) => {
  try {
    const { memberId } = req.body;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if requester is team admin or owner
    const adminMember = team.members.find(
      (member) => member.user.toString() === req.user._id.toString() && (member.role === 'admin' || member.role === 'owner')
    );

    // Also check if the requester is the team owner directly
    const isOwner = team.owner.toString() === req.user._id.toString();

    if (!adminMember && !isOwner) {
      return res.status(403).json({ message: 'Only team admins or owner can add members' });
    }

    // Check if member is already in the team
    const existingMember = team.members.find(
      (member) => member.user.toString() === memberId
    );

    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this team' });
    }

    // Check if member is in admin's friends list
    const adminUser = await User.findById(req.user._id);
    const isFriend = adminUser.friends.includes(memberId);

    if (!isFriend) {
      return res.status(400).json({ message: 'You can only add friends to the team' });
    }

    // Add member to team directly
    team.members.push({ user: memberId, role: 'member', joinedAt: new Date() });
    await team.save();

    // Add team to member's teams
    await User.findByIdAndUpdate(memberId, {
      $push: { teams: team._id },
    });

    // Add member to all team's workspaces
    if (team.workspaces && team.workspaces.length > 0) {
      for (const workspaceId of team.workspaces) {
        const workspace = await Workspace.findById(workspaceId);
        if (workspace) {
          // Check if user is already a member of this workspace
          const isAlreadyMember = workspace.members.some(
            (member) => member.user.toString() === memberId
          );

          if (!isAlreadyMember) {
            workspace.members.push({ user: memberId, role: 'member', joinedAt: new Date() });
            await workspace.save();

            // Add workspace to member's workspaces
            await User.findByIdAndUpdate(memberId, {
              $push: { workspaces: workspaceId },
            });
          }
        }
      }
    }

    // Send notification to the newly added member (don't fail if notification fails)
    try {
      await createNotification({
        recipient: memberId,
        sender: req.user._id,
        type: 'team_member_added',
        title: 'Added to Team',
        message: `You have been added to the team "${team.name}" by ${req.user.name}`,
        data: { teamId: team._id },
      });

      // Emit socket event for real-time notification
      if (req.io) {
        req.io.to(`user-${memberId}`).emit('notification', {
          type: 'team_member_added',
          title: 'Added to Team',
          message: `You have been added to the team "${team.name}" by ${req.user.name}`,
          data: { teamId: team._id },
        });

        // Emit member-added event to all team workspaces
        if (team.workspaces && team.workspaces.length > 0) {
          team.workspaces.forEach(workspaceId => {
            req.io.to(`workspace-${workspaceId}`).emit('member-added', {
              memberId,
              teamId: team._id,
              workspaceId,
            });
          });
        }

        // Emit workspace update event to refresh member's workspace list
        req.io.to(`user-${memberId}`).emit('workspaces-updated');
      }
    } catch (notificationError) {
      console.error('Failed to send notification for team member addition:', notificationError);
      // Don't fail the operation if notification fails
    }

    const populatedTeam = await Team.findById(team._id)
      .populate('members.user', 'name email avatar');

    res.status(200).json(populatedTeam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:memberId
// @access  Private (Team admin only)
const removeMemberFromTeam = async (req, res) => {
  try {
    const { memberId } = req.params;
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if requester is team admin or owner
    const adminMember = team.members.find(
      (member) => member.user.toString() === req.user._id.toString() && (member.role === 'admin' || member.role === 'owner')
    );

    // Also check if the requester is the team owner directly
    const isOwner = team.owner.toString() === req.user._id.toString();

    if (!adminMember && !isOwner) {
      return res.status(403).json({ message: 'Only team admins or owner can remove members' });
    }

    // Cannot remove the team owner
    if (team.owner.toString() === memberId) {
      return res.status(400).json({ message: 'Cannot remove the team owner' });
    }

    // Check if member exists in the team
    const memberIndex = team.members.findIndex(
      (member) => member.user.toString() === memberId
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Member not found in team' });
    }

    // Remove member from team
    team.members.splice(memberIndex, 1);
    await team.save();

    // Remove team from member's teams
    await User.findByIdAndUpdate(memberId, {
      $pull: { teams: team._id },
    });

    // Send notification to the removed member (don't fail if notification fails)
    try {
      await createNotification({
        recipient: memberId,
        sender: req.user._id,
        type: 'team_member_removed',
        title: 'Removed from Team',
        message: `You have been removed from the team "${team.name}" by ${req.user.name}`,
        data: { teamId: team._id },
      });

      // Emit socket event for real-time notification
      if (req.io) {
        req.io.to(`user-${memberId}`).emit('notification', {
          type: 'team_member_removed',
          title: 'Removed from Team',
          message: `You have been removed from the team "${team.name}" by ${req.user.name}`,
          data: { teamId: team._id },
        });

        // Emit member-removed event to all team workspaces
        if (team.workspaces && team.workspaces.length > 0) {
          team.workspaces.forEach(workspaceId => {
            req.io.to(`workspace-${workspaceId}`).emit('member-removed', {
              memberId,
              teamId: team._id,
              workspaceId,
            });
          });
        }
      }
    } catch (notificationError) {
      console.error('Failed to send notification for team member removal:', notificationError);
      // Don't fail the operation if notification fails
    }

    const populatedTeam = await Team.findById(team._id)
      .populate('members.user', 'name email avatar');

    res.status(200).json(populatedTeam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Generate invitation link for team
// @route   POST /api/teams/:id/invite
// @access  Private (Team admin only)
const generateInviteLink = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if requester is team admin or owner
    const adminMember = team.members.find(
      (member) => member.user.toString() === req.user._id.toString() && (member.role === 'admin' || member.role === 'owner')
    );

    // Also check if the requester is the team owner directly
    const isOwner = team.owner.toString() === req.user._id.toString();

    if (!adminMember && !isOwner) {
      return res.status(403).json({ message: 'Only team admins or owner can generate invite links' });
    }

    // Generate a unique token for the invitation
    const crypto = require('crypto');
    const inviteToken = crypto.randomBytes(32).toString('hex');

    // Store the invite token with expiration (24 hours)
    team.inviteToken = inviteToken;
    team.inviteTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await team.save();

    // Generate the invitation link
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join-team/${inviteToken}`;

    res.status(200).json({
      inviteLink,
      expiresAt: team.inviteTokenExpires,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept invitation link
// @route   POST /api/teams/join/:token
// @access  Private
const acceptInviteLink = async (req, res) => {
  try {
    const { token } = req.params;

    // Find team by invite token
    const team = await Team.findOne({
      inviteToken: token,
      inviteTokenExpires: { $gt: new Date() },
    });

    if (!team) {
      return res.status(404).json({ message: 'Invalid or expired invitation link' });
    }

    // Check if user is already a member
    const existingMember = team.members.find(
      (member) => member.user.toString() === req.user._id.toString()
    );

    if (existingMember) {
      return res.status(400).json({ message: 'You are already a member of this team' });
    }

    // Add user to team
    team.members.push({ user: req.user._id, role: 'member', joinedAt: new Date() });
    await team.save();

    // Add team to user's teams
    await User.findByIdAndUpdate(req.user._id, {
      $push: { teams: team._id },
    });

    // Send notification to the user
    await createNotification({
      recipient: req.user._id,
      sender: team.owner,
      type: 'team_invite_accepted',
      title: 'Welcome to Team',
      message: `You have successfully joined the team "${team.name}"`,
      data: { teamId: team._id },
    });

    const populatedTeam = await Team.findById(team._id)
      .populate('members.user', 'name email avatar');

    res.status(200).json(populatedTeam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTeam,
  getTeams,
  acceptTeamInvite,
  declineTeamInvite,
  addMemberToTeam,
  removeMemberFromTeam,
  generateInviteLink,
  acceptInviteLink,
};
