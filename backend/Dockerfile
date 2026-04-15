FROM node:18-slim

# Install Java JDK 17 and Python 3
RUN apt-get update && \
    apt-get install -y --no-install-recommends openjdk-17-jdk python3 && \
    rm -rf /var/lib/apt/lists/*

# Set up the application directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy everything from the backend folder
COPY . .

# Environment defaults
ENV PORT=5000

# Expose the port
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
