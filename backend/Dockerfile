FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install deps
RUN npm install

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Nest
RUN npm run build

# Start ONLY the app (Prisma already ran during build)
CMD ["node", "dist/main.js"]
