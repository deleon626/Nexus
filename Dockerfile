# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Declare build arguments for Vite environment variables
# These must be passed during docker build with --build-arg
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_CONVEX_URL

# Set environment variables for build time
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install dependencies (clean, reproducible install)
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Health check for Coolify monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
