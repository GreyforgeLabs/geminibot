#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

check_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "ERROR: $1 is required but not installed."
        exit 1
    fi
}

check_command node
check_command npm

cd "$PROJECT_DIR"
npm install

if ! command -v gemini >/dev/null 2>&1; then
    echo "WARNING: gemini-cli was not found. Install it before running the bridge."
fi

if [ ! -f "$PROJECT_DIR/.env" ] && [ -f "$PROJECT_DIR/.env.example" ]; then
    cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
    echo "Created .env from .env.example. Fill in local values before runtime use."
fi

npm test
