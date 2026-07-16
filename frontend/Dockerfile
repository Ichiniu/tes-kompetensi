# Tahap 1: Build Stage
FROM node:22-alpine AS builder

WORKDIR /app

# Salin package.json & lockfile
COPY package*.json ./

# Install dependensi
RUN npm install

# Salin seluruh source code frontend
COPY . .

# Build aplikasi Nuxt untuk produksi (SSR)
RUN npm run build


# Tahap 2: Production Stage
FROM node:22-alpine

WORKDIR /app

# Set environment ke production
ENV NODE_ENV=production

# Salin folder hasil build dari stage builder
COPY --from=builder /app/.output ./.output

# Expose port (biasanya 3000 untuk Nuxt)
EXPOSE 3000

# Jalankan server hasil build
CMD ["node", ".output/server/index.mjs"]
