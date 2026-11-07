#!/bin/sh
set -e

if [ "$APP_ENV" = "production" ]; then
  NPM_SCRIPT="start"
else
  NPM_SCRIPT="dev"
fi

echo "Starting talent-pipeline-tracker ($NPM_SCRIPT) on port 3000..."
npm --prefix /app/talent-pipeline-tracker run "$NPM_SCRIPT" -- --hostname 0.0.0.0 --port 3000 &
WEBSITE_PID=$!

echo "Starting backoffice ($NPM_SCRIPT) on port 3001..."
npm --prefix /app/backoffice run "$NPM_SCRIPT" -- --hostname 0.0.0.0 --port 3001 &
BACKOFFICE_PID=$!

trap 'kill $WEBSITE_PID $BACKOFFICE_PID' INT TERM

wait
