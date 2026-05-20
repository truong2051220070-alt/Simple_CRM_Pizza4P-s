# Build stage - Vite
FROM node:18-alpine AS build

WORKDIR /app

# Accept build argument for Vite environment variables
ARG VITE_API_URL=http://localhost:5000
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./

RUN npm install

# Copy source files
COPY . .

# Build with Vite (environment variables are baked in)
RUN npm run build

# Serve stage
FROM node:18-alpine

WORKDIR /app

RUN npm install -g serve

# Copy built app from build stage
COPY --from=build /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000 || exit 1

CMD ["serve", "-s", "dist", "-l", "3000"]
