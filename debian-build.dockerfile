# Base image
FROM ubuntu:20.04

# Install system dependencies
RUN apt-get update && apt-get install -y curl gnupg build-essential

# Install Rust via rustup
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install Node.js (latest v22 via NodeSource)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && node -v && npm -v

# Create app directory
WORKDIR /app

# Copy files
COPY . .

# Install Node.js dependencies
RUN npm install

# Uncomment below to run Tauri build (needs Rust + Node)
# RUN npm run tauri build

# Default command — just keeps container alive for debug
CMD ["top", "-b"]
