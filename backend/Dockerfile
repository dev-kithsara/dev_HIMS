# backend/Dockerfile

# 1. Base Image
FROM node:20-alpine

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Install OpenSSL (v3.x) — Alpine 3.20 ships OpenSSL 3 by default.
RUN apk add --no-cache openssl

# 4. Copy package.json and package-lock.json first
COPY package*.json ./

# 5. Install dependencies
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm ci --ignore-scripts --no-audit --no-fund --loglevel=error

# 6. Copy the rest of the application code
COPY . .

# 7. Generate Prisma Client at BUILD TIME
RUN ./node_modules/.bin/prisma generate --no-hints

# 8. Build the TypeScript code into JavaScript
RUN npm run build

# 9. Change ownership to non-root node user
RUN chown -R node:node /app

# 10. Run as non-root user
USER node

# 11. Expose the port the app runs on
EXPOSE 5000

# 12. The command to start the application
CMD ["npm", "start"]
