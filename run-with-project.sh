#!/bin/bash

# Script to run Taskmaster UI with a custom project path
# Usage: ./run-with-project.sh /path/to/your/project [dev|start]

if [ $# -eq 0 ]; then
    echo "Usage: $0 <project-path> [dev|start]"
    echo "Example: $0 /Users/john/my-project dev"
    echo "Example: $0 ../other-project start"
    exit 1
fi

PROJECT_PATH="$1"
MODE="${2:-dev}"

# Check if project path exists
if [ ! -d "$PROJECT_PATH" ]; then
    echo "Error: Project path '$PROJECT_PATH' does not exist"
    exit 1
fi

# Check if .taskmaster directory exists in the project
if [ ! -d "$PROJECT_PATH/.taskmaster" ]; then
    echo "Warning: .taskmaster directory not found in '$PROJECT_PATH'"
    echo "Make sure this is a Taskmaster project or run 'task-master init' in the target project"
fi

# Get absolute path
PROJECT_ABSOLUTE=$(cd "$PROJECT_PATH" && pwd)

echo "🚀 Starting Taskmaster UI for project: $PROJECT_ABSOLUTE"
echo "📋 Looking for tasks in: $PROJECT_ABSOLUTE/.taskmaster/tasks/tasks.json"
echo "🌐 UI will be available at: http://localhost:3001"
echo ""

# Set environment variable and run the appropriate script
export TASKMASTER_PROJECT_ROOT="$PROJECT_ABSOLUTE"

if [ "$MODE" = "start" ]; then
    npm run start
else
    npm run dev
fi 