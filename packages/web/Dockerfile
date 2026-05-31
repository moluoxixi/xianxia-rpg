FROM node:22-alpine AS build

WORKDIR /app
RUN corepack enable

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/api/package.json packages/api/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/model/package.json packages/model/package.json
COPY packages/web/package.json packages/web/package.json

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build:model && pnpm run build:core && pnpm run build:web

FROM nginx:1.27-alpine AS runtime

COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/web /usr/share/nginx/html

EXPOSE 80
