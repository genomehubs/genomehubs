FROM ubuntu:20.04
LABEL maintainer="contact@genomehubs.org"
LABEL license="MIT"
ARG VERSION=2.10.2
LABEL version=$VERSION
ENV CONTAINER_VERSION=$VERSION

RUN apt-get update \
    && DEBIAN_FRONTEND="noninteractive" apt-get -y --no-install-recommends install \
    curl \
    ca-certificates \
    pigz \
    wget

RUN mkdir -p /genomehubs/tests

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

ENV PATH $CONDA_DEFAULT_ENV/bin:$PATH

ENV PYTHONPATH $CONDA_DEFAULT_ENV/lib/python3.9/site-packages:$PYTHONPATH

WORKDIR /tmp

RUN curl https://ftp.ncbi.nlm.nih.gov/pub/datasets/command-line/v2/linux-amd64/datasets > datasets \
    && chmod 755 datasets \
    && mv datasets /usr/bin/datasets

COPY genomehubs-*-py3-none-manylinux2014_x86_64.whl ./

RUN pip install ./genomehubs-*-py3-none-manylinux2014_x86_64.whl \
    && rm ./genomehubs-*-py3-none-manylinux2014_x86_64.whl

WORKDIR /genomehubs

USER genomehubs

CMD genomehubs -h