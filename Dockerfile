FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY server ./server
COPY src/domain ./src/domain
COPY src/providers/routes.ts ./src/providers/routes.ts
COPY src/data/tutorial.ts ./src/data/tutorial.ts
RUN npm run build:server

FROM node:22-bookworm-slim
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8787 ENABLE_LIVE_REQUESTS=false
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && mkdir -p /data && chown node:node /data
COPY --from=build /app/build-server ./build-server
COPY data/roads ./data/roads
USER node
ENV BUDGET_LEDGER_PATH=/data/pilot-budget.json
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:8787/api/status').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "build-server/index.mjs"]
