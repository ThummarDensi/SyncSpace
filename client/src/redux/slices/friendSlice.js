import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { getWorkspaces } from './workspaceSlice';

const initialState = {
  friends: [],
  friendRequests: [],
  loading: false,
  error: null,
};

// Send friend request
export const sendFriendRequest = createAsyncThunk(
  'friends/sendRequest',
  async (friendId, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/friends/request', { friendId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Accept friend request
export const acceptFriendRequest = createAsyncThunk(
  'friends/acceptRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/friends/accept/${requestId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Reject friend request
export const rejectFriendRequest = createAsyncThunk(
  'friends/rejectRequest',
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/friends/reject/${requestId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Get friends list
export const getFriends = createAsyncThunk(
  'friends/getFriends',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/friends');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Get friend requests
export const getFriendRequests = createAsyncThunk(
  'friends/getRequests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/friends/requests');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Remove friend
export const removeFriend = createAsyncThunk(
  'friends/removeFriend',
  async (friendId, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/friends/${friendId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Accept team invite
export const acceptTeamInvite = createAsyncThunk(
  'friends/acceptTeamInvite',
  async (teamId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/teams/${teamId}/accept`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Decline team invite
export const declineTeamInvite = createAsyncThunk(
  'friends/declineTeamInvite',
  async (teamId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/teams/${teamId}/decline`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Add member to team
export const addMemberToTeam = createAsyncThunk(
  'friends/addMemberToTeam',
  async ({ teamId, memberId }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post(`/api/teams/${teamId}/members`, { memberId });
      // Refresh workspaces since adding to team may add to workspaces
      dispatch(getWorkspaces());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Accept team member invitation
export const acceptTeamMemberInvite = createAsyncThunk(
  'friends/acceptTeamMemberInvite',
  async (teamId, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.put(`/api/teams/${teamId}/members/accept`);
      // Refresh workspaces since accepting invite may add to workspaces
      dispatch(getWorkspaces());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Remove member from team
export const removeMemberFromTeam = createAsyncThunk(
  'friends/removeMemberFromTeam',
  async ({ teamId, memberId }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/teams/${teamId}/members/${memberId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Generate team invite link
export const generateTeamInviteLink = createAsyncThunk(
  'friends/generateTeamInviteLink',
  async (teamId, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/teams/${teamId}/invite`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

// Accept team invite link
export const acceptTeamInviteLink = createAsyncThunk(
  'friends/acceptTeamInviteLink',
  async (token, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post(`/api/teams/join/${token}`);
      // Refresh workspaces since joining team may add to workspaces
      dispatch(getWorkspaces());
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data.message);
    }
  }
);

const friendSlice = createSlice({
  name: 'friends',
  initialState,
  reducers: {
    updateFriendStatus: (state, action) => {
      const { userId, isOnline } = action.payload;
      const friend = state.friends.find(f => f._id === userId);
      if (friend) {
        friend.isOnline = isOnline;
        friend.lastSeen = new Date().toISOString();
      }
    },
    updateFriendOnline: (state, action) => {
      const friend = state.friends.find(f => f._id === action.payload.userId);
      if (friend) {
        friend.isOnline = true;
        friend.lastSeen = new Date().toISOString();
      }
    },
    updateFriendOffline: (state, action) => {
      const friend = state.friends.find(f => f._id === action.payload.userId);
      if (friend) {
        friend.isOnline = false;
        friend.lastSeen = new Date().toISOString();
      }
    },

    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Send friend request
      .addCase(sendFriendRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(sendFriendRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Accept friend request
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        // Remove the accepted request from friendRequests array
        state.friendRequests = state.friendRequests.filter(req => req._id !== action.meta.arg);
      })
      // Reject friend request
      .addCase(rejectFriendRequest.fulfilled, (state, action) => {
        // Remove the rejected request from friendRequests array
        state.friendRequests = state.friendRequests.filter(req => req._id !== action.meta.arg);
      })
      // Get friends
      .addCase(getFriends.pending, (state) => {
        state.loading = true;
      })
      .addCase(getFriends.fulfilled, (state, action) => {
        state.loading = false;
        state.friends = action.payload;
      })
      .addCase(getFriends.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get friend requests
      .addCase(getFriendRequests.pending, (state) => {
        state.loading = true;
      })
      .addCase(getFriendRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.friendRequests = action.payload;
      })
      .addCase(getFriendRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Remove friend
      .addCase(removeFriend.fulfilled, (state, action) => {
        // Refresh friends list
      })
      // Add member to team
      .addCase(addMemberToTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMemberToTeam.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(addMemberToTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Accept team member invitation
      .addCase(acceptTeamMemberInvite.fulfilled, (state, action) => {
        // Handle successful acceptance
      })
      // Remove member from team
      .addCase(removeMemberFromTeam.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeMemberFromTeam.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(removeMemberFromTeam.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Generate team invite link
      .addCase(generateTeamInviteLink.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateTeamInviteLink.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(generateTeamInviteLink.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Accept team invite link
      .addCase(acceptTeamInviteLink.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(acceptTeamInviteLink.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(acceptTeamInviteLink.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { updateFriendStatus, updateFriendOnline, updateFriendOffline, clearError } = friendSlice.actions;
export default friendSlice.reducer;
