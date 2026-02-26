---
phase: 05-pwa-polish-production
plan: 05
type: execute
wave: 4
depends_on: ["05-pwa-polish-production-01", "05-pwa-polish-production-02", "05-pwa-polish-production-03", "05-pwa-polish-production-04"]
files_modified: [.env.example, .coolify/config.json, Dockerfile, nginx.conf]
autonomous: false
requirements: []
user_setup:
  - service: coolify
    why: "Production deployment platform"
    env_vars:
      - name: VITE_CONVEX_DEPLOYMENT_URL
        source: "Convex Dashboard -> Deployment -> URL"
      - name: VITE_CLERK_PUBLISHABLE_KEY
        source: "Clerk Dashboard -> API Keys -> Publishable Key"
    dashboard_config:
      - task: "Create new application in Coolify"
        location: "Coolify Dashboard -> New Application"
      - task: "Configure environment variables"
        location: "Coolify -> Application -> Environment Variables"

must_haves:
  truths:
    - "App deploys to Coolify with proper environment configuration"
    - "Health check endpoint returns 200 OK with status JSON"
    - "Static assets served via nginx for production"
    - "Staging and Production environments configured separately"
  artifacts:
    - path: ".env.example"
      provides: "Environment variable template for Coolify configuration"
      contains: "VITE_CONVEX_DEPLOYMENT_URL, VITE_CLERK_PUBLISHABLE_KEY"
    - path: "Dockerfile"
      provides: "Multi-stage build for production static assets with nginx serving"
    - path: "nginx.conf"
      provides: "nginx configuration for SPA routing and health check endpoint"
    - path: ".coolify/config.json"
      provides: "Coolify deployment configuration"
  key_links:
    - from: "Dockerfile"
      to: "nginx:alpine"
      via: "Base image for static asset serving"
      pattern: "FROM.*nginx.*alpine"
    - from: "nginx.conf"
      to: "/health endpoint"
      via: "Health check location block"
      pattern: "location.*health"
---

<objective>
Deploy PWA to Coolify infrastructure with proper environment configuration, health checks, and nginx static asset serving. Configure separate Staging and Production environments.

Purpose: Make app production-ready with proper deployment infrastructure. Per CONTEXT.md: two environments (Staging/Production) on Coolify, all config via environment variables, basic monitoring with health checks, Coolify subdomain.

Output: Dockerfile, nginx config, .env.example, Coolify configuration, deployed app
</objective>

<execution_context>
@/Users/dennyleonardo/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dennyleonardo/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/05-pwa-polish-production/05-CONTEXT.md
@.planning/phases/05-pwa-polish-production/05-RESEARCH.md

# Existing environment configuration
@.env.example — Clerk and Convex environment variables
@package.json — Build scripts (npm run build)
</context>

<tasks>

<task type="auto">
  <name>Create production Dockerfile for static asset serving</name>
  <files>Dockerfile</files>
  <action>
Create Dockerfile in project root:

1. Multi-stage build pattern:
   - Stage 1: Build stage (node:18-alpine)
   - Stage 2: Serve stage (nginx:alpine)

2. Build stage:
   - WORKDIR /app
   - COPY package.json package-lock.json ./
   - RUN npm ci --only=production (clean install, no dev deps)
   - COPY . .
   - RUN npm run build
   - Output in /app/dist

3. Serve stage:
   - FROM nginx:alpine
   - COPY --from=build /app/dist /usr/share/nginx/html
   - COPY nginx.conf /etc/nginx/nginx.conf
   - EXPOSE 80
   - CMD ["nginx", "-g", "daemon off;"]

4. Build optimizations:
   - Use npm ci for reproducible builds
   - Leverage Docker layer caching (package files before source)
   - Minimal final image (alpine-based nginx ~10MB)

5. Health check:
   - HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3
   - CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

This creates production-ready container with nginx serving static assets and health check for Coolify monitoring.
  </action>
  <verify>grep -q "nginx:alpine" Dockerfile && grep -q "HEALTHCHECK" Dockerfile</verify>
  <done>Dockerfile with multi-stage build, nginx serving, and health check</done>
</task>

<task type="auto">
  <name>Create nginx configuration for SPA routing and health endpoint</name>
  <files>nginx.conf</files>
  <action>
Create nginx.conf in project root:

1. Basic nginx config:
   - worker_processes auto
   - events { worker_connections 1024; }
   - http { include mime.types; ... }

2. Server block:
   - listen 80
   - server_name _ (any domain)
   - root /usr/share/nginx/html
   - index index.html

3. SPA routing (critical for React Router):
   - location / {
       try_files $uri $uri/ /index.html;
     }
   - This ensures all routes work on refresh

4. Health check endpoint (per RESEARCH.md):
   - location /health {
       access_log off;
       add_header Content-Type application/json;
       return 200 '{"status":"healthy"}';
     }
   - Simple JSON response for Coolify monitoring

5. Static asset caching:
   - location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$ {
       expires 1y;
       add_header Cache-Control "public, immutable";
     }

6. Gzip compression:
   - gzip on
   - gzip_types text/plain text/css application/json application/javascript text/xml application/xml

7. Security headers:
   - add_header X-Frame-Options "SAMEORIGIN" always
   - add_header X-Content-Type-Options "nosniff" always
   - add_header X-XSS-Protection "1; mode=block" always

8. PWA headers:
   - add_header Service-Worker-Allowed "/" always
   - Ensure service worker works at root path
  </action>
  <verify>grep -q "try_files.*index.html" nginx.conf && grep -q "location.*health" nginx.conf</verify>
  <done>nginx config with SPA routing, health endpoint, static caching, and PWA headers</done>
</task>

<task type="auto">
  <name>Create .env.example template for Coolify environment variables</name>
  <files>.env.example</files>
  <action>
Create or update .env.example:

1. Required environment variables (existing):
   - VITE_CONVEX_DEPLOYMENT_URL — Convex deployment URL
   - VITE_CLERK_PUBLISHABLE_KEY — Clerk publishable key

2. Add comments explaining each variable:
   - What it's for
   - Where to get the value
   - Example format (if applicable)

3. Add production-specific notes:
   - Comment about using runtime variables in Coolify
   - Note about Convex URL being different for staging vs production

4. Format:
   ```
   # Convex Backend
   # Get from: Convex Dashboard -> Deployments -> Your Deployment
   VITE_CONVEX_DEPLOYMENT_URL=https://your-deployment.convex.cloud

   # Clerk Authentication
   # Get from: Clerk Dashboard -> API Keys -> Publishable Key
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

5. Add note about VITE_ prefix:
   - Vite requires VITE_ prefix for client-side env vars
   - Only VITE_ prefixed vars are exposed to browser

This template will be used to configure Coolify environment variables.
  </action>
  <verify>grep -q "VITE_CONVEX_DEPLOYMENT_URL\|VITE_CLERK_PUBLISHABLE_KEY" .env.example</verify>
  <done>.env.example with all required environment variables and sourcing comments</done>
</task>

<task type="auto">
  <name>Create Coolify deployment configuration</name>
  <files>.coolify/config.json</files>
  <action>
Create .coolify directory and config.json file:

1. Coolify configuration structure:
   - name: "nexus-qc-forms"
   - description: "Mobile QC Form Data Entry PWA"
   - version: "1.0.0"

2. Build configuration:
   - build_command: "npm run build"
   - build_directory: "dist"
   - dockerfile_path: "Dockerfile"

3. Environment variables template:
   - List required vars with empty values for Coolify to fill
   - staging and production sections

4. Health check configuration:
   - health_check_path: "/health"
   - health_check_interval: 30 (seconds)

5. Deployment notes:
   - Uses Coolify subdomain (*.sslip.io)
   - No custom domain required per CONTEXT.md
   - Two environments: staging and production

6. Port configuration:
   - container_port: 80 (nginx)

This file documents the Coolify setup for reference.
  </action>
  <verify>grep -q "health_check_path" .coolify/config.json && grep -q "build_command" .coolify/config.json</verify>
  <done>Coolify configuration with build command, health check, and port settings</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Dockerfile, nginx config, .env.example, and Coolify configuration for production deployment</what-built>
  <how-to-verify>
1. Test local build: docker build -t nexus-pwa .
2. Run container: docker run -p 8080:80 nexus-pwa
3. Visit http://localhost:8080
4. Verify app loads and routes work (refresh on /worker/forms)
5. Verify health endpoint: curl http://localhost:8080/health
6. Verify health returns: {"status":"healthy"}
7. Check browser console for PWA manifest loads correctly
8. Confirm no 404s for static assets
9. Stop container and proceed to Coolify deployment
  </how-to-verify>
  <resume-signal>Type "approved" to proceed to Coolify deployment or describe issues</resume-signal>
</task>

<task type="checkpoint:human-action" gate="blocking">
  <what-built>Coolify deployment with Staging and Production environments</what-built>
  <how-to-verify>
1. Log in to Coolify dashboard
2. Create new application: select "Dockerfile" source
3. Connect GitHub repository
4. Configure Staging environment:
   - Set branch: main (or staging branch)
   - Add environment variables from .env.example
   - Set health check path: /health
5. Deploy Staging and verify:
   - Visit staging URL (*.sslip.io)
   - Test health endpoint
   - Verify app functionality
6. Configure Production environment:
   - Duplicate Staging config
   - Update environment variables for production Convex/Clerk
   - Deploy Production
7. Verify Production URL works correctly
  </how-to-verify>
  <resume-signal>Type "deployed" when both Staging and Production are live</resume-signal>
</task>

</tasks>

<verification>
Overall verification:
1. Dockerfile creates production image with nginx serving static assets
2. nginx.conf handles SPA routing (try_files with index.html fallback)
3. Health check endpoint /health returns {"status":"healthy"} JSON
4. .env.example documents all required environment variables
5. Coolify config documents build and deployment settings
6. Docker container runs locally with health check passing
7. App deploys to Coolify Staging environment
8. App deploys to Coolify Production environment
9. Both environments use correct Convex/Clerk credentials
</verification>

<success_criteria>
1. Docker image builds successfully
2. Health check endpoint responds with 200 OK and JSON status
3. SPA routing works on refresh (no 404s on sub-routes)
4. Staging environment deployed and functional
5. Production environment deployed and functional
6. PWA features work in deployed environments (install prompt, service worker)
7. Environment variables properly configured for both environments
</success_criteria>

<output>
After completion, create .planning/phases/05-pwa-polish-production/05-pwa-polish-production-05-SUMMARY.md
</output>
