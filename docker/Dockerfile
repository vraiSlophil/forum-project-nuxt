FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false

EXPOSE 3000

CMD ["sh", "/app/docker/entrypoint.sh"]
