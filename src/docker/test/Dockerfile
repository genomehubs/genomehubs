## Build stage - compile dependencies and prepare test environment
FROM node:24-bookworm-slim AS builder
ARG VERSION=2.7.37
LABEL maintainer="contact@genomehubs.org"
LABEL license="MIT"
LABEL version=$VERSION

## Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt

## Install Miniforge for Python environment
RUN wget -q -O Miniforge3.sh "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh" \
    && bash Miniforge3.sh -b -p /opt/conda \
    && rm Miniforge3.sh

ARG CONDA_DIR=/opt/conda

## Create isolated conda environment with Python 3.11
RUN $CONDA_DIR/bin/conda create -n genomehubs python=3.11 \
    && $CONDA_DIR/bin/conda clean --all --yes

## Install genomehubs CLI wheel
WORKDIR /tmp
COPY src/docker/test/genomehubs-*-py3-none-manylinux*.whl ./

RUN CONDA_DEFAULT_ENV=/opt/conda/envs/genomehubs \
    PATH=/opt/conda/envs/genomehubs/bin:$PATH \
    pip install --no-cache-dir $(ls ./genomehubs-*-py3-none-manylinux*.whl) \
    && rm ./genomehubs-*-py3-none-manylinux*.whl

## Runtime stage - full test environment
FROM node:24-bookworm-slim
ARG VERSION=2.7.37
LABEL maintainer="contact@genomehubs.org"
LABEL license="MIT"
LABEL version=$VERSION
ENV CONTAINER_VERSION=$VERSION

## Install runtime dependencies and testing tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    pigz \
    software-properties-common \
    wget \
    && rm -rf /var/lib/apt/lists/*

## Add Google Chrome repository and install Chrome for Puppeteer
RUN curl -fsSL https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /etc/apt/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list \
    && apt-get update && apt-get install -y --no-install-recommends \
    google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

## Install yq for YAML parsing
RUN curl -fsSL https://github.com/mikefarah/yq/releases/download/v4.16.2/yq_linux_amd64 \
    -o /usr/local/bin/yq \
    && chmod +x /usr/local/bin/yq

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

## Create non-root user for security (reuse node user from base image)
RUN mkdir -p /genomehubs/tests /genomehubs/tests-out /genomehubs/resources \
    && chown -R node:node /genomehubs

## Copy conda environment from builder
COPY --from=builder --chown=node:node /opt/conda /opt/conda

## Set environment variables
ENV CONDA_DIR=/opt/conda
ENV CONDA_DEFAULT_ENV=${CONDA_DIR}/envs/genomehubs
ENV PATH=/genomehubs:${CONDA_DEFAULT_ENV}/bin:${PATH}
ENV PYTHONPATH=${CONDA_DEFAULT_ENV}/lib/python3.11/site-packages
ENV PYTHONUNBUFFERED=1

WORKDIR /genomehubs

## Install Node test dependencies
RUN npm install --production js-yaml puppeteer

## Copy test components - API build directory structure
COPY --chown=node:node src/docker/test/genomehubs-api/ ./genomehubs-api/

## Install API runtime dependencies for test server
COPY src/genomehubs-api/package.json src/genomehubs-api/package-lock.json ./genomehubs-api/
WORKDIR /genomehubs/genomehubs-api
RUN npm ci --omit=dev
WORKDIR /genomehubs

## Copy UI server code and built assets
COPY --chown=node:node src/genomehubs-ui/package.json src/genomehubs-ui/package-lock.json src/genomehubs-ui/.npmrc ./genomehubs-ui/
COPY --chown=node:node src/genomehubs-ui/src/server ./genomehubs-ui/src/server
COPY --chown=node:node src/docker/test/genomehubs-ui-dist/ ./genomehubs-ui/dist/

## Install UI runtime dependencies for test server
WORKDIR /genomehubs/genomehubs-ui
RUN npm ci --omit=dev
WORKDIR /genomehubs

## Copy test scripts and utilities
COPY --chown=node:node src/docker/test/genomehubs-test-ui.sh ./genomehubs-test-ui
COPY --chown=node:node src/docker/test/genomehubs-test-api.sh ./genomehubs-test-api
COPY --chown=node:node src/docker/test/test-ui.mjs ./test-ui.mjs
COPY --chown=node:node src/docker/test/config.yaml ./config/config.yaml

## Make test scripts executable
RUN chmod 755 /genomehubs/genomehubs-test-* /genomehubs/test-ui.mjs

## Drop privileges to node user (UID 1000)
USER node

## Default command - show help
CMD ["genomehubs", "--help"]