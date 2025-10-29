#!/bin/bash

echo "============================================"
echo "   SyncSpace - Installation and Setup"
echo "============================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "[1/6] Checking Node.js installation..."
node --version
echo ""

echo "[2/6] Note: Make sure MongoDB is running locally or update .env with your MongoDB URI"
echo ""

# Install backend dependencies
echo "[3/6] Installing backend dependencies..."
cd server

if [ ! -f package.json ]; then
    echo "ERROR: package.json not found in server directory!"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install backend dependencies!"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "[4/6] Creating backend .env file..."
    cp .env.example .env
    echo "Please edit server/.env file with your configuration!"
else
    echo "[4/6] Backend .env file already exists"
fi

cd ..

# Install frontend dependencies
echo "[5/6] Installing frontend dependencies..."
cd client

if [ ! -f package.json ]; then
    echo "ERROR: package.json not found in client directory!"
    exit 1
fi

npm install
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install frontend dependencies!"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "[6/6] Creating frontend .env file..."
    cp .env.example .env
else
    echo "[6/6] Frontend .env file already exists"
fi

cd ..

echo ""
echo "============================================"
echo "   Installation Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Make sure MongoDB is running"
echo "2. Update server/.env with your database URI if needed"
echo "3. Run: npm run seed (in server directory) to add sample data"
echo "4. Run: ./start-dev.sh to start both servers"
echo ""
