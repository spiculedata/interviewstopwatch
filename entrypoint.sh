#!/bin/bash

echo "entrypoint.sh executed..."

# Exit immediately if any command exits with a non-zero status
set -e

yarn host

wait

exec "$@"
