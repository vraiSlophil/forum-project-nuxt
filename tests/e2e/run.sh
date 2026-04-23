#!/bin/sh
set -eu

if [ -f /.dockerenv ]; then
  exec npm run test:e2e:local
fi

docker compose up -d db app >/dev/null
exec docker compose exec -T app npm run test:e2e:local
