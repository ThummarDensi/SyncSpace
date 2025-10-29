# SyncSpace - Real-Time Collaborative Workspace

## 🚀 Overview
SyncSpace is an all-in-one platform built with the MERN stack that allows teams to manage projects, share files, and collaborate in real-time.

## 🔧 Tech Stack

### Frontend
- React.js with Vite
- Standard CSS (no Tailwind)
- Redux Toolkit for state management
- Socket.IO client for real-time updates
- React Beautiful DnD for drag-and-drop
- Quill.js for rich text editing

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- Socket.IO server
- JWT authentication
- Multer for file uploads
- bcrypt for password hashing

## 📁 Project Structure

```
SyncSpace/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── redux/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── server/                 # Node.js backend
    ├── config/
    ├── controllers/
    ├── middleware/
    ├── models/
    ├── routes/
    ├── uploads/
    ├── utils/
    ├── server.js
    └── package.json
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in server directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/syncspace
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

4. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in client directory:
```
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

5. Open browser at `http://localhost:5173`

## 🧩 Key Features

### 1. User & Team Management
- JWT-based authentication
- Role-based access control (Admin, Member)
- Team invitation and management

### 2. Workspace & Project Management
- Multiple workspaces per user
- Project organization
- Kanban boards, chat, files, and docs per workspace

### 3. Dynamic Kanban Boards
- Create, read, update, delete tasks
- Drag-and-drop functionality
- Real-time synchronization across all users
- Status columns: To-Do, In Progress, Done

### 4. Real-time Collaborative Document Editor
- Multi-user editing
- Auto-save functionality
- Document versioning
- Real-time cursor tracking

### 5. Integrated Chat & Comment System
- Real-time workspace chat
- Task-specific comment threads
- Mention notifications

### 6. File Sharing & Version Control
- Upload/download files
- File version history
- Organized by project

### 7. Notification System
- Real-time notifications
- Mentions, task updates, messages
- In-app notification center

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Workspaces
- `GET /api/workspaces` - Get all workspaces
- `POST /api/workspaces` - Create workspace
- `GET /api/workspaces/:id` - Get workspace by ID
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace

### Teams
- `POST /api/teams` - Create team
- `POST /api/teams/:id/invite` - Invite member
- `DELETE /api/teams/:id/members/:userId` - Remove member

### Kanban Boards
- `GET /api/boards/:workspaceId` - Get boards
- `POST /api/boards` - Create board
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### Tasks
- `GET /api/tasks/:boardId` - Get tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Documents
- `GET /api/documents/:workspaceId` - Get documents
- `POST /api/documents` - Create document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document

### Chat
- `GET /api/chat/:workspaceId` - Get messages
- `POST /api/chat` - Send message

### Files
- `POST /api/files/upload` - Upload file
- `GET /api/files/:workspaceId` - Get files
- `GET /api/files/download/:id` - Download file

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

## 🔌 Socket.IO Events

### Connection
- `connection` - Client connects
- `disconnect` - Client disconnects

### Workspace
- `join-workspace` - Join workspace room
- `leave-workspace` - Leave workspace room

### Kanban
- `task-created` - New task created
- `task-updated` - Task updated
- `task-deleted` - Task deleted
- `task-moved` - Task moved between columns

### Documents
- `document-join` - Join document editing
- `document-change` - Document content changed
- `document-cursor` - Cursor position update

### Chat
- `chat-message` - New message sent
- `typing` - User typing indicator

### Notifications
- `notification` - New notification

## 🧪 Testing

### Run Backend Tests
```bash
cd server
npm test
```

### Run Frontend Tests
```bash
cd client
npm test
```

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Protected routes and API endpoints
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Helmet.js for security headers

## 📦 Deployment

### Backend (Heroku/Railway/Render)
1. Set environment variables
2. Build: `npm install`
3. Start: `npm start`

### Frontend (Vercel/Netlify)
1. Build: `npm run build`
2. Deploy `dist` folder

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Your Team Name

## 🙏 Acknowledgments

- MERN Stack Community
- Socket.IO Documentation
- React Beautiful DnD
- Quill.js Editor
