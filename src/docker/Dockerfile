## Build stage - compile/prepare all dependencies
FROM ubuntu:24.04 AS builder
ARG VERSION=2.12.2
LABEL maintainer="contact@genomehubs.org"
LABEL license="MIT"
LABEL version=$VERSION

## Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

## Create app directory
RUN mkdir -p /genomehubs

WORKDIR /opt

## Download and install Miniforge for Python environment
RUN wget -q -O Miniforge3.sh "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh" \
    && bash Miniforge3.sh -b -p /opt/conda \
    && rm Miniforge3.sh

ARG CONDA_DIR=/opt/conda

## Create isolated conda environment with Python 3.11
RUN $CONDA_DIR/bin/conda create -n genomehubs python=3.11 \
    && $CONDA_DIR/bin/conda clean --all --yes

## Download NCBI datasets tool
WORKDIR /tmp
RUN curl -fsSL https://ftp.ncbi.nlm.nih.gov/pub/datasets/command-line/v2/linux-amd64/datasets \
    -o datasets \
    && chmod 755 datasets

## Copy and install genomehubs wheel
COPY src/docker/context/genomehubs-*-py3-none-manylinux*.whl ./

RUN CONDA_DEFAULT_ENV=/opt/conda/envs/genomehubs \
    PATH=/opt/conda/envs/genomehubs/bin:$PATH \
    pip install --no-cache-dir ./genomehubs-*-py3-none-manylinux*.whl \
    && rm ./genomehubs-*-py3-none-manylinux*.whl

## Runtime stage - minimal production image
FROM ubuntu:24.04
ARG VERSION=2.12.2
LABEL maintainer="contact@genomehubs.org"
LABEL license="MIT"
LABEL version=$VERSION
ENV CONTAINER_VERSION=$VERSION

## Install only runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    pigz \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

## Set up directories for the existing ubuntu user (UID 1000)
RUN mkdir -p /genomehubs /genomehubs/sources \
    && chown -R ubuntu:ubuntu /genomehubs

## Copy conda environment from builder
COPY --from=builder --chown=genomehubs:genomehubs /opt/conda /opt/conda

## Copy datasets tool from builder
COPY --from=builder /tmp/datasets /usr/local/bin/datasets

## Set environment variables
ENV CONDA_DIR=/opt/conda
ENV CONDA_DEFAULT_ENV=${CONDA_DIR}/envs/genomehubs
ENV PATH=${CONDA_DEFAULT_ENV}/bin:${PATH}
ENV PYTHONPATH=${CONDA_DEFAULT_ENV}/lib/python3.11/site-packages:${PYTHONPATH}
ENV PYTHONUNBUFFERED=1
ENV CONTAINER_VERSION=$VERSION

## Set working directory
WORKDIR /genomehubs

## Drop privileges to ubuntu user (UID 1000)
USER ubuntu

## Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD genomehubs --version || exit 1

## Default command
CMD ["genomehubs", "--help"]