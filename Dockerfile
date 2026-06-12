# ==========================================
# DOCKERFILE - FRONTEND NEXT.JS (PRODUCCIÓN)
# ==========================================
# Este archivo crea una imagen optimizada ("multi-stage build") de Next.js.
# Genera una construcción independiente ("standalone") que copia solo los archivos
# estrictamente necesarios para correr en el servidor, minimizando el peso.
# NOTA: En producción, `NEXT_PUBLIC_API_URL` puede ser inyectado durante el build.
FROM node:18-alpine AS base


# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Set Next.js Telemetry to disabled
ENV NEXT_TELEMETRY_DISABLED 1
# Pasa las variables de entorno para que el build se conecte a la API
ENV NEXT_PUBLIC_API_URL=http://localhost:8000/api
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set correct permissions
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
