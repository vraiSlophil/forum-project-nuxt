FROM node:24-bookworm-slim

WORKDIR /app


RUN apt-get update -y && apt-get install -y openssl

ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NPM_CONFIG_FUND=false

COPY ./package.json ./package-lock.json ./

RUN npm ci --omit=dev

EXPOSE 3000
