#!/bin/sh
set -eu

cd /app

if [ ! -f package.json ]; then
  echo "Missing /app/package.json" >&2
  exit 1
fi

needs_install=0

if [ ! -d node_modules ]; then
  needs_install=1
elif [ ! -f node_modules/.package-lock.json ]; then
  needs_install=1
elif ! cmp -s package-lock.json node_modules/.package-lock.json; then
  needs_install=1
fi

if [ "$needs_install" -eq 1 ]; then
  echo "Installing npm dependencies..."
  npm ci
  cp package-lock.json node_modules/.package-lock.json
fi

echo "Generating Prisma client..."
npm run prisma:generate

exec "$@"
