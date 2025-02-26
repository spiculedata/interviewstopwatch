#!/bin/bash

echo "entrypoint.sh executed..."

# Exit immediately if any command exits with a non-zero status
set -e

dapr run --app-id interviewstopwatch --app-port 5173 --dapr-http-port 3500 -- yarn dev

wait

exec "$@"
