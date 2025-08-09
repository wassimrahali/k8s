# frontend/Dockerfile (multistage)
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json angular.json tsconfig.app.json tsconfig.json ./  
COPY src ./src
RUN npm ci
RUN npx ng build --output-path=dist --configuration=production

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# optional: simple nginx default; keep port 80
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
