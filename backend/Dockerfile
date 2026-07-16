FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependensi system jika dibutuhkan oleh sqlite3 (walaupun v6+ biasanya sudah pre-built)
# RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependensi
RUN npm install

# Copy sisa source code
COPY . .

# Expose backend port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
