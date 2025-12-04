#!/bin/bash

# 3FM Display Server Start Script

echo "🎉 Starting 3FM Serious Request Display Server..."
echo ""

# Get local IP
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo "📡 Your server will be accessible at:"
echo ""
echo "   🌐 Local:   http://localhost:3000"
echo "   🌐 Network: http://$IP:3000"
echo ""
echo "👉 Open this URL on your Gobride: http://$IP:3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
node server.js
