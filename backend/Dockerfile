FROM node:20-slim

# Install the runtimes and compilers used by the execution engine.
# build-essential provides gcc and g++ for C/C++ submissions.
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential openjdk-17-jdk python3 && \
    rm -rf /var/lib/apt/lists/*

# Fail the image build early if any required tool is missing.
RUN gcc --version && g++ --version && javac -version && java -version && python3 --version

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
