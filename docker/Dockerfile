FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false

COPY ./docker/entrypoint.sh /usr/local/bin/forum-entrypoint
RUN chmod +x /usr/local/bin/forum-entrypoint

ENTRYPOINT ["forum-entrypoint"]

EXPOSE 3000
