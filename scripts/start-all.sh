#!/bin/bash

# Start the backend server
echo "Starting backend server..."
cd backend
npm install
npm start &

# Start the frontend application
echo "Starting frontend application..."
cd ../frontend
npm install
npm run dev &

# Start the admin application
echo "Starting admin application..."
cd ../admin
npm install
npm run dev &

# Start the doctor application
echo "Starting doctor application..."
cd ../doctor
npm install
npm run dev &

# Wait for all background processes to finish
wait

echo "All services started."