FROM node:24-bookworm
LABEL maintainer="contact@genomehubs.org"
LABEL license="MIT"
ARG VERSION=2.7.37
LABEL version=$VERSION
ENV CONTAINER_VERSION=$VERSION

RUN apt-get update \
    && DEBIAN_FRONTEND="noninteractive" apt-get -y --no-install-recommends install \
    curl \
    ca-certificates \
    gnupg \
    pigz \
    software-properties-common \
    wget

RUN curl -fsSL https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /etc/apt/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

RUN apt-get update \
    && apt-get install -y \
    --no-install-recommends \
    google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

ARG VERSION=v4.16.2
ARG BINARY=yq_linux_386
RUN wget https://github.com/mikefarah/yq/releases/download/${VERSION}/${BINARY} -O /usr/bin/yq \ 
    && chmod +x /usr/bin/yq

RUN mkdir -p /genomehubs/tests /genomehubs/tests-out

RUN useradd -m genomehubs \
    && chown -R genomehubs:genomehubs /genomehubs

WORKDIR /opt

RUN wget -O Miniforge3.sh "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-$(uname)-$(uname -m).sh" \
    && bash Miniforge3.sh -b -p /opt/conda \
    && rm Miniforge3.sh

ARG CONDA_DIR=/opt/conda

RUN $CONDA_DIR/bin/conda create -n genomehubs python=3.9 \
    && $CONDA_DIR/bin/conda clean --all --yes

ENV CONDA_DEFAULT_ENV $CONDA_DIR/envs/genomehubs

ENV PATH /genomehubs:$CONDA_DEFAULT_ENV/bin:$PATH

ENV PYTHONPATH $CONDA_DEFAULT_ENV/lib/python3.9/site-packages:$PYTHONPATH

WORKDIR /tmp

COPY genomehubs-*-py3-none-manylinux2014_x86_64.whl ./

RUN pip install ./genomehubs-*-py3-none-manylinux2014_x86_64.whl \
    && rm ./genomehubs-*-py3-none-manylinux2014_x86_64.whl

WORKDIR /genomehubs

RUN npm install js-yaml puppeteer

COPY genomehubs-api/ genomehubs-api/

COPY genomehubs-ui-linux genomehubs-ui

COPY genomehubs-test-ui.sh genomehubs-test-ui

COPY genomehubs-test-api.sh genomehubs-test-api

COPY test-ui.mjs test-ui.mjs

RUN chmod 755 /genomehubs/genomehubs-*

USER genomehubs

CMD genomehubs -h


