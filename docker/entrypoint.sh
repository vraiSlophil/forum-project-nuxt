#!/bin/sh
set -eu

cd /app

if [ ! -d node_modules ] || [ -z "$(ls -A node_modules 2>/dev/null)" ]; then
  echo "Installing dependencies..."
  npm ci --ignore-scripts
fi

if [ -f prisma/schema.prisma ]; then
  echo "Generating Prisma client..."
  npm run prisma:generate

  if [ -d prisma/migrations ] && find prisma/migrations -mindepth 1 -maxdepth 1 | grep -q .; then
    echo "Applying Prisma migrations..."
    npm run db:migrate:deploy
  else
    echo "No Prisma migrations found, syncing schema with db push..."
    npm run db:push
  fi
fi

exec npm run dev:docker
