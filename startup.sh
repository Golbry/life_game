#!/bin/bash

cleanup() {
    echo "正在清理 8887 端口进程..."
    PID=$(lsof -ti :8887)
    [ -n "$PID" ] && kill -9 $PID
    exit 0
}

trap cleanup SIGINT

# Set environment variables
export FLASK_APP="app.py"
export FLASK_DEBUG=1
export FLASK_ENV="development"
export FLASK_SQLALCHEMY_DATABASE_URI="sqlite:///life_game.db"
export FLASK_SECRET_KEY="life_game_secret_key"
export FLASK_RUN_HOST="127.0.0.1"
export FLASK_RUN_PORT="8887"

# Do cleanup
echo "Cleaning up cache files..."
find . -type d -name "__pycache__" -prune -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true
rm -rf poetry.lock

# Install dependencies
echo "Installing dependencies..."
poetry install

# Initialize the database
echo "Initializing database..."
# Reset migrations
if poetry run flask reset-migration --help > /dev/null 2>&1; then
    echo "Resetting migrations..."
    poetry run flask reset-migration
fi

# Sync database
if poetry run flask sync-db --help > /dev/null 2>&1; then
    echo "Syncing database..."
    poetry run flask sync-db
fi

# Initialize seed data
echo "Initializing seed data..."
poetry run flask seed-data

# Start Flask application
echo "Starting Flask application..."
poetry run flask run --host=127.0.0.1 --port=8887 &

# Keep container running
echo "Application startup complete."
echo "主程序运行中..."
tail -f /dev/null