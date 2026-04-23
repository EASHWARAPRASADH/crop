#!/bin/bash
echo "🚀 Starting GOTEK Production Server..."
echo "📡 Your Local IP is: $(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)"
echo "🔗 Access the tool at: http://$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1):5001"
echo "--------------------------------------------------"

# Stop any existing processes on port 5001
lsof -ti:5001 | xargs kill -9 2>/dev/null

# Start the server
node server.js
