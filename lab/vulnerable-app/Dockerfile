FROM node:24-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1
ENV AUDIT_LAB_ONLY=1
ENV DATABASE_URL=postgresql://labapp:lab-only-app-database@database:5432/usms_lab
COPY package.json package-lock.json ./
RUN npm ci
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY prisma ./prisma
COPY scripts ./scripts
COPY public ./public
COPY tsconfig.json postcss.config.mjs ./
COPY lab/vulnerable-app/overrides ./
COPY lab/vulnerable-app/guard.mjs ./guard.mjs
RUN node guard.mjs && npx prisma generate && npx next build
EXPOSE 3002
CMD ["sh", "-c", "node guard.mjs && npm run db:deploy && npm run db:seed && npx next start --hostname 0.0.0.0 --port 3002"]
