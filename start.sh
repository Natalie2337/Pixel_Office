#!/bin/bash
# Start Pixel Office

echo "🏢 Starting Pixel Office..."
echo ""

# Start backend
echo "📦 Starting backend server..."
cd backend

if [ ! -d "venv" ]; then
  echo "   Creating virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt -q

python3 main.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 2

# Start frontend
echo "🎨 Starting frontend dev server..."
cd frontend

if [ ! -d "node_modules" ]; then
  echo "   Installing dependencies..."
  npm install
fi

npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Pixel Office is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all services."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
