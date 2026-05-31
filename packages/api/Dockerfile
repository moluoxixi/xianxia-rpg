FROM node:22-alpine AS build

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/api/package.json packages/api/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/model/package.json packages/model/package.json
COPY packages/web/package.json packages/web/package.json

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build:model && pnpm run build:core && pnpm run build:api

FROM node:22-alpine AS runtime

WORKDIR /app
RUN corepack enable

ENV NODE_ENV=production
ENV PORT=3000
ENV XIANXIA_DATA_DIR=/data

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY packages/api/package.json packages/api/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/model/package.json packages/model/package.json
COPY packages/web/package.json packages/web/package.json
RUN pnpm install --prod --frozen-lockfile

COPY --from=build /app/dist/api ./dist/api
COPY --from=build /app/packages/core/dist ./packages/core/dist
COPY --from=build /app/packages/model/dist ./packages/model/dist

VOLUME ["/data"]
EXPOSE 3000

CMD ["node", "dist/api/src/main.js"]
