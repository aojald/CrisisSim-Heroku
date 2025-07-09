#!/bin/bash

# Executive Cyber Crisis Simulator - Development Startup Script

echo "🚀 Starting Executive Cyber Crisis Simulator..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $SERVER_PID $VITE_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start the Socket.IO server in background
echo "🔌 Starting Socket.IO server on port 3001..."
node server/index.js &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Start Vite dev server in background
echo "⚡ Starting Vite dev server on port 5173..."
npm run dev:vite &
VITE_PID=$!

# Wait a moment for Vite to start
sleep 3

echo ""
echo "✅ Both servers are running!"
echo "📱 Frontend: http://localhost:5173"
echo "🔌 Backend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $SERVER_PID $VITE_PID