#!/bin/bash

echo "============================================"
echo "   Starting SyncSpace Development Servers"
echo "============================================"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup EXIT INT TERM

# Start backend server
echo "Starting Backend Server..."
cd server
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend server
echo "Starting Frontend Server..."
cd client
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "============================================"
echo "Both servers are running!"
echo ""
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"
echo "============================================"
echo ""

# Wait for both processes
wait
