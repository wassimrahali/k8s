# ---------- Builder ----------
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (cache-friendly)
COPY package.json package-lock.json ./

RUN npm ci

# Copy the rest of the Angular project
COPY angular.json ./
COPY tsconfig*.json ./
COPY .browserslistrc ./
COPY src ./src

# Build production bundle
RUN npx ng build --configuration=production

# ---------- Runtime ----------
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
