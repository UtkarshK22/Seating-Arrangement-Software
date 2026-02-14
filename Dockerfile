FROM node:18-alpine

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

# Copy backend source
COPY backend .

# Generate Prisma client
RUN npx prisma generate

# Build NestJS
RUN npm run build

# Start the app
CMD ["node", "dist/main.js"]
