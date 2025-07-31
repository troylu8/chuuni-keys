FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# install system dependencies
RUN apt-get update && apt-get install -y \
    gnupg \
    pkg-config \
    libwebkit2gtk-4.1-dev \
    javascriptcoregtk-4.1 \
    libsoup-3.0 \
    libglib2.0-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev

ENV PKG_CONFIG_PATH=/usr/lib/x86_64-linux-gnu/pkgconfig

# install rust
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# install node
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && apt-get install -y nodejs 

WORKDIR /app
COPY . .

RUN npm install
RUN npm run tauri build

# keep container alive so I can copy .deb file 
CMD ["top", "-b"]


# docker cp "<container name>:/app/src-tauri/target/release/bundle/deb/chuuni keys_<version>_amd64.deb" ~