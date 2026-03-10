# ─── Stage 1: Install production dependencies ─────────────────────────────────
FROM oven/bun:1.2-alpine AS deps
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM oven/bun:1.2-alpine AS release

ENV NODE_ENV=production

WORKDIR /app

# Copy only what is needed at runtime
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY drizzle ./drizzle
COPY package.json tsconfig.json drizzle.config.ts ./

EXPOSE 3000

# Run as the unprivileged bun user (built into the base image)
USER bun

ENTRYPOINT ["bun", "run", "src/index.ts"]
