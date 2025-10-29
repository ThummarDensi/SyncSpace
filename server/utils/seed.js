const User = require('../models/User');
const Team = require('../models/Team');
const Workspace = require('../models/Workspace');
const Board = require('../models/Board');
const Task = require('../models/Task');
const mongoose = require('mongoose');
require('dotenv').config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB Connected for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Team.deleteMany({});
    await Workspace.deleteMany({});
    await Board.deleteMany({});
    await Task.deleteMany({});

    console.log('Cleared existing data...');

    // Create users
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@syncspace.com',
        password: 'password123',
        role: 'admin',
      },
      {
        name: 'John Doe',
        email: 'john@syncspace.com',
        password: 'password123',
        role: 'member',
      },
      {
        name: 'Jane Smith',
        email: 'jane@syncspace.com',
        password: 'password123',
        role: 'member',
      },
      {
        name: 'Bob Wilson',
        email: 'bob@syncspace.com',
        password: 'password123',
        role: 'member',
      },
    ]);

    console.log('Users created...');

    // Create team
    const team = await Team.create({
      name: 'Development Team',
      description: 'Main development team',
      owner: users[0]._id,
      members: [
        { user: users[0]._id, role: 'admin' },
        { user: users[1]._id, role: 'member' },
        { user: users[2]._id, role: 'member' },
        { user: users[3]._id, role: 'member' },
      ],
    });

    console.log('Team created...');

    // Create workspace
    const workspace = await Workspace.create({
      name: 'SyncSpace Project',
      description: 'Main project workspace',
      owner: users[0]._id,
      team: team._id,
      members: [
        { user: users[0]._id, role: 'admin' },
        { user: users[1]._id, role: 'member' },
        { user: users[2]._id, role: 'member' },
        { user: users[3]._id, role: 'member' },
      ],
    });

    console.log('Workspace created...');

    // Create board
    const board = await Board.create({
      name: 'Sprint 1',
      description: 'First sprint board',
      workspace: workspace._id,
      createdBy: users[0]._id,
      columns: [
        { id: 'todo', title: 'To Do', order: 0 },
        { id: 'in-progress', title: 'In Progress', order: 1 },
        { id: 'done', title: 'Done', order: 2 },
      ],
    });

    console.log('Board created...');

    // Create tasks
    await Task.create([
      {
        title: 'Setup project structure',
        description: 'Initialize the project with MERN stack',
        board: board._id,
        columnId: 'done',
        order: 0,
        priority: 'high',
        assignees: [users[1]._id],
        createdBy: users[0]._id,
        tags: ['setup', 'backend'],
      },
      {
        title: 'Design database schema',
        description: 'Create MongoDB schemas for all models',
        board: board._id,
        columnId: 'done',
        order: 1,
        priority: 'high',
        assignees: [users[1]._id],
        createdBy: users[0]._id,
        tags: ['database', 'backend'],
      },
      {
        title: 'Implement authentication',
        description: 'JWT-based authentication system',
        board: board._id,
        columnId: 'in-progress',
        order: 0,
        priority: 'high',
        assignees: [users[2]._id],
        createdBy: users[0]._id,
        tags: ['auth', 'security'],
      },
      {
        title: 'Create Kanban board UI',
        description: 'Build drag-and-drop Kanban board interface',
        board: board._id,
        columnId: 'in-progress',
        order: 1,
        priority: 'medium',
        assignees: [users[3]._id],
        createdBy: users[0]._id,
        tags: ['frontend', 'ui'],
      },
      {
        title: 'Implement real-time chat',
        description: 'Add Socket.IO for real-time messaging',
        board: board._id,
        columnId: 'todo',
        order: 0,
        priority: 'medium',
        assignees: [users[2]._id, users[3]._id],
        createdBy: users[0]._id,
        tags: ['realtime', 'chat'],
      },
      {
        title: 'File upload functionality',
        description: 'Implement file upload with version control',
        board: board._id,
        columnId: 'todo',
        order: 1,
        priority: 'low',
        assignees: [users[1]._id],
        createdBy: users[0]._id,
        tags: ['files', 'backend'],
      },
    ]);

    console.log('Tasks created...');

    // Update references
    await User.updateMany(
      { _id: { $in: users.map((u) => u._id) } },
      { $push: { workspaces: workspace._id, teams: team._id } }
    );

    await Workspace.findByIdAndUpdate(workspace._id, {
      $push: { boards: board._id },
    });

    console.log('✅ Seed data created successfully!');
    console.log('\nLogin credentials:');
    console.log('Email: admin@syncspace.com | Password: password123');
    console.log('Email: john@syncspace.com | Password: password123');
    console.log('Email: jane@syncspace.com | Password: password123');
    console.log('Email: bob@syncspace.com | Password: password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
