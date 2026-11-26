# ── Stage 1: Node builder ────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (layer cache)
COPY package.json package-lock.json ./

# Install dependencies (ci = exact versions from lockfile)
RUN npm ci

# Copy source
COPY . .

# Production build
RUN npm run build -- --configuration=production

# ── Stage 2: nginx runtime ───────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy Angular build output
COPY --from=builder /app/dist/web/browser /usr/share/nginx/html

# Copy custom nginx config (SPA routing support)
COPY ../../infra/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Non-root friendly: nginx listens on 8080 (see nginx.conf)
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
