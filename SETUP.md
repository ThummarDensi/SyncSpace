# SyncSpace Setup Instructions

## Quick Start Guide

### 1. Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your configurations
# Make sure MongoDB is running locally or update MONGODB_URI

# Seed the database with sample data
npm run seed

# Start the development server
npm run dev
```

The backend will start on `http://localhost:5000`

### 2. Frontend Setup

```bash
# Navigate to client directory (in a new terminal)
cd client

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Start the development server
npm run dev
```

The frontend will start on `http://localhost:5173`

### 3. Access the Application

1. Open your browser and go to `http://localhost:5173`
2. Login with demo credentials:
   - **Email**: admin@syncspace.com
   - **Password**: password123

Alternative users:
- john@syncspace.com / password123
- jane@syncspace.com / password123
- bob@syncspace.com / password123

## Features Available

### ✅ Phase 1: Core Setup
- User authentication (Register/Login with JWT)
- User profile management
- Workspace creation and management
- Team management with roles (Admin/Member)

### ✅ Phase 2: Real-time Collaboration
- Dynamic Kanban boards with drag-and-drop
- Real-time task updates via Socket.IO
- Real-time collaborative document editor
- Multi-user editing support

### ✅ Phase 3: Communication
- Real-time workspace chat
- Task-specific comments
- File upload and download
- File version control

### ✅ Phase 4: Notifications & Polish
- Real-time notification system
- Mentions in chat and comments
- Task assignment notifications
- Responsive design with standard CSS

## Project Structure

```
SyncSpace/
├── server/                   # Backend (Node.js + Express + MongoDB)
│   ├── config/              # Database configuration
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Auth, error handling, file upload
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── utils/               # Socket.IO and utilities
│   └── server.js            # Entry point
│
└── client/                   # Frontend (React + Vite)
    ├── src/
    │   ├── components/      # Reusable components
    │   ├── pages/           # Page components
    │   ├── redux/           # Redux store and slices
    │   ├── services/        # API and Socket services
    │   ├── styles/          # CSS files
    │   ├── App.jsx          # Main app component
    │   └── main.jsx         # Entry point
    └── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Workspaces
- `GET /api/workspaces` - Get all workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace details
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace
- `POST /api/workspaces/:id/members` - Add member
- `DELETE /api/workspaces/:id/members/:userId` - Remove member

### Boards & Tasks
- `GET /api/boards/:workspaceId` - Get boards
- `POST /api/boards` - Create board
- `GET /api/tasks/:boardId` - Get tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `PUT /api/tasks/:id/move` - Move task (drag & drop)
- `DELETE /api/tasks/:id` - Delete task

### Documents
- `GET /api/documents/:workspaceId` - Get documents
- `POST /api/documents` - Create document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Chat & Comments
- `GET /api/chat/:workspaceId` - Get messages
- `POST /api/chat` - Send message
- `GET /api/comments/:taskId` - Get comments
- `POST /api/comments` - Add comment

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/:workspaceId` - Get files
- `GET /api/files/download/:id` - Download file
- `POST /api/files/:id/version` - Upload new version

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

## Socket.IO Events

### Kanban Board
- `task-created` - New task created
- `task-updated` - Task updated
- `task-deleted` - Task deleted
- `task-moved` - Task moved between columns

### Documents
- `document-join` - User joined document
- `document-leave` - User left document
- `document-change` - Document content changed
- `document-cursor` - Cursor position update

### Chat
- `chat-message` - New message
- `typing` - User typing indicator

### Notifications
- `notification` - New notification received

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/syncspace
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## MongoDB Setup

### Option 1: Local MongoDB
1. Install MongoDB: https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Use default connection string: `mongodb://localhost:27017/syncspace`

### Option 2: MongoDB Atlas (Cloud)
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

## Troubleshooting

### Backend won't start
- Ensure MongoDB is running
- Check if port 5000 is available
- Verify .env file exists with correct values

### Frontend won't connect to backend
- Ensure backend is running on port 5000
- Check CORS settings in server.js
- Verify .env file in client directory

### Socket.IO not working
- Check firewall settings
- Ensure WebSocket connections are allowed
- Verify Socket URL in client .env

## Production Deployment

### Backend (Heroku/Railway/Render)
1. Set environment variables
2. Ensure MongoDB is accessible
3. Update CLIENT_URL to production frontend URL

### Frontend (Vercel/Netlify)
1. Build: `npm run build`
2. Deploy dist folder
3. Set environment variables
4. Update API_URL and SOCKET_URL

## Tech Stack Summary

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Auth**: JWT (jsonwebtoken)
- **Security**: bcryptjs, helmet, express-rate-limit
- **File Upload**: Multer

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Styling**: Standard CSS (no framework)
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast
- **Drag & Drop**: React Beautiful DnD
- **Rich Text**: React Quill

## Next Steps

1. **Customize Styling**: Modify CSS files in `client/src/styles/`
2. **Add Features**: Extend models and create new endpoints
3. **Security**: Change JWT_SECRET, add rate limiting
4. **Testing**: Add unit and integration tests
5. **Documentation**: Update API documentation

## Support

For issues or questions:
1. Check existing GitHub issues
2. Review documentation
3. Check console logs for errors

---

**Happy Coding! 🚀**
