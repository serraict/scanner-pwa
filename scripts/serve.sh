#!/bin/bash

# Simple local server for QR Scanner PWA
# Serves on port 8000 by default

PORT=${1:-8000}

echo "Starting QR Scanner PWA on http://localhost:$PORT"
echo "Camera access requires HTTPS in production, but works on localhost"
echo "Press Ctrl+C to stop"

# Use Python's built-in server (works on most systems)
if command -v python3 &> /dev/null; then
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer $PORT
else
    echo "Error: Python not found. Please install Python or use another web server."
    exit 1
fi