#!/bin/bash

# AI-DPRS - Start Script
# Runs both Flask backend and React frontend with a single command

echo "========================================="
echo "  AI-DPRS - Disaster Prediction System"
echo "========================================="
echo ""

# Get the directory where this script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if venv exists
if [ ! -d "$DIR/backend/venv" ]; then
    echo "Virtual environment not found."
    echo "Run this first:"
    echo "  cd \"$DIR/backend\" && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "$DIR/client/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd "$DIR/client" && npm install
    echo ""
fi

# Start Flask backend using venv python directly
echo "Starting backend on http://127.0.0.1:5001"
cd "$DIR/backend"
"$DIR/backend/venv/bin/python" app.py &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 4

# Start React frontend
echo "Starting frontend on http://localhost:3000"
cd "$DIR/client"
npm start &
FRONTEND_PID=$!

echo ""
echo "Both servers running!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://127.0.0.1:5001"
echo "   YOLO Detection: http://127.0.0.1:5001/"
echo ""
echo "Press Ctrl+C to stop both servers."

# Trap Ctrl+C to kill both processes
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

# Wait for either process to exit
wait
