# 🚀 SyncSpace - Complete Quick Start Guide

## Prerequisites
- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** - Local installation or MongoDB Atlas account
- **Git** (optional) - For version control

---

## 🎯 Quick Installation (Windows)

### Option 1: Automated Installation
```bash
# Run the installation script
install.bat

# Seed sample data
cd server
npm run seed
cd ..

# Start development servers
start-dev.bat
```

### Option 2: Manual Installation
```bash
# 1. Install backend dependencies
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI

# 2. Seed sample data
npm run seed

# 3. Install frontend dependencies
cd ../client
npm install
cp .env.example .env

# 4. Start backend (in one terminal)
cd ../server
npm run dev

# 5. Start frontend (in another terminal)
cd ../client
npm run dev
```

---

## 🎯 Quick Installation (macOS/Linux)

### Option 1: Automated Installation
```bash
# Make scripts executable
chmod +x install.sh start-dev.sh

# Run installation
./install.sh

# Seed sample data
cd server
npm run seed
cd ..

# Start development servers
./start-dev.sh
```

### Option 2: Manual Installation
Same as Windows Option 2 above

---

## 🌐 Access the Application

1. **Frontend**: http://localhost:5173
2. **Backend API**: http://localhost:5000
3. **API Health**: http://localhost:5000/api/health

---

## 👤 Demo Credentials

After running `npm run seed`, use these credentials:

| Email | Password | Role |
|-------|----------|------|
| admin@syncspace.com | password123 | Admin |
| john@syncspace.com | password123 | Member |
| jane@syncspace.com | password123 | Member |
| bob@syncspace.com | password123 | Member |

---

## 📁 Project Structure

```
SyncSpace/
├── server/                  # Backend (Node.js + Express)
│   ├── config/             # Database configuration
│   ├── controllers/        # Business logic
│   ├── middleware/         # Auth, upload, error handling
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── utils/              # Socket.IO, utilities
│   ├── uploads/            # File storage
│   └── server.js           # Entry point
│
└── client/                  # Frontend (React + Vite)
    ├── src/
    │   ├── components/     # Reusable UI components
    │   ├── pages/          # Route pages
    │   ├── redux/          # State management
    │   ├── services/       # API & Socket clients
    │   ├── styles/         # CSS files
    │   ├── App.jsx         # Main component
    │   └── main.jsx        # Entry point
    └── package.json
```

---

## ✨ Key Features

### ✅ Implemented Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Role-based access control (Admin/Member)
   - Profile management

2. **Workspace Management**
   - Create/edit/delete workspaces
   - Team collaboration
   - Member management

3. **Kanban Boards**
   - Drag-and-drop tasks
   - Real-time updates via Socket.IO
   - Custom columns
   - Task priorities

4. **Real-time Collaboration**
   - Socket.IO integration
   - Live task updates
   - Instant notifications

5. **User Interface**
   - Clean, modern design
   - Standard CSS (no frameworks)
   - Fully responsive
   - Dark mode ready

### 🔄 Extensible Features

The placeholder pages (Chat, Documents, Files) provide structure for:
- Real-time chat system
- Collaborative document editing
- File management with versioning

---

## 🛠️ Development Commands

### Backend
```bash
cd server
npm run dev      # Start development server
npm start        # Start production server
npm run seed     # Seed sample data
```

### Frontend
```bash
cd client
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## 🔧 Configuration

### Backend Environment Variables (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/syncspace
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Frontend Environment Variables (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

---

## 📊 Sample Data

After running `npm run seed`, you'll have:
- 4 users (Admin, John, Jane, Bob)
- 1 development team
- 1 workspace (SyncSpace Project)
- 1 Kanban board (Sprint 1)
- 6 sample tasks across different columns

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```bash
# Make sure MongoDB is running
# Windows: Start MongoDB service
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in server/.env
```

### Port Already in Use
```bash
# Backend (port 5000)
# Windows: netstat -ano | findstr :5000
# Unix: lsof -ti:5000 | xargs kill

# Frontend (port 5173)
# Windows: netstat -ano | findstr :5173
# Unix: lsof -ti:5173 | xargs kill
```

### Socket.IO Not Connecting
1. Check that backend is running
2. Verify VITE_SOCKET_URL in client/.env
3. Check browser console for errors
4. Ensure firewall allows WebSocket connections

---

## 🚀 Deployment

### Backend (Heroku/Railway/Render)
1. Create account and new project
2. Connect repository or use CLI
3. Set environment variables
4. Deploy

### Frontend (Vercel/Netlify)
1. Run `npm run build` in client directory
2. Deploy `dist` folder
3. Set environment variables
4. Update API URLs

---

## 📚 API Documentation

Full API documentation is available in `SETUP.md`

### Quick API Reference
- **Auth**: `/api/auth/*`
- **Workspaces**: `/api/workspaces/*`
- **Boards**: `/api/boards/*`
- **Tasks**: `/api/tasks/*`
- **Documents**: `/api/documents/*`
- **Chat**: `/api/chat/*`
- **Files**: `/api/files/*`
- **Notifications**: `/api/notifications/*`

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- MERN Stack Community
- Socket.IO Documentation
- React Beautiful DnD
- Redux Toolkit Team

---

## 📞 Support

- Check `README.md` for detailed information
- Review `SETUP.md` for comprehensive setup guide
- Check console logs for debugging
- Review Network tab for API issues

---

**Built with ❤️ using the MERN Stack**

**Happy Coding! 🚀**
