#!/bin/bash

# Define variables
APP_NAME="telegram-stats"
PORT=2013
DIST_DIR="./dist"

# Check if the dist directory exists
if [ ! -d "$DIST_DIR" ]; then
    echo "Error: Dist directory not found at $DIST_DIR"
    exit 1
fi

# Install serve globally if not already installed
if ! command -v serve &> /dev/null; then
    echo "Installing serve..."
    npm install -g serve
fi

# Stop the existing PM2 process if it exists
pm2 stop $APP_NAME 2>/dev/null
pm2 delete $APP_NAME 2>/dev/null

# Start the new PM2 process using serve
pm2 serve $DIST_DIR $PORT --name $APP_NAME --spa

echo "Application $APP_NAME is now serving on port $PORT"
