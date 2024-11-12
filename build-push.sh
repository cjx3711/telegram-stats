#!/bin/bash

# Load environment variables from .env
if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found"
    exit 1
fi

if [ -z "$REMOTE_DIR" ]; then
    echo "Error: REMOTE_DIR environment variable is not set"
    exit 1
fi

yarn build && rsync -avz --delete dist "$REMOTE_DIR"
