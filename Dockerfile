FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/api/package.json packages/api/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/web/package.json packages/web/package.json

RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV XIANXIA_DATA_DIR=/data

COPY package.json package-lock.json ./
COPY packages/api/package.json packages/api/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/web/package.json packages/web/package.json
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/packages/core/dist ./packages/core/dist

VOLUME ["/data"]
EXPOSE 3000

CMD ["node", "dist/api/src/main.js"]
