FROM node:20-alpine

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json* ./

# Install with Node 20 — no legacy peer deps issues
RUN npm install

# Copy rest of source
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
