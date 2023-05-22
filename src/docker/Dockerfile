FROM ubuntu:20.04
LABEL maintainer="contact@genomehubs.org"
LABEL license="MIT"
ARG VERSION=2.7.0
LABEL version=$VERSION
ENV CONTAINER_VERSION=$VERSION

RUN apt-get update \
    && DEBIAN_FRONTEND="noninteractive" apt-get -y --no-install-recommends install \
    curl \
    pigz \
    wget

RUN mkdir -p /genomehubs

RUN useradd -m genomehubs \
    && chown -R genomehubs:genomehubs /genomehubs

ARG CONDA_DIR=/opt/conda

RUN $CONDA_DIR/bin/conda env create -n genomehubs python=3.8 \
    && $CONDA_DIR/bin/conda clean --all --yes

ENV CONDA_DEFAULT_ENV $CONDA_DIR/envs/genomehubs

ENV PATH $CONDA_DEFAULT_ENV/bin:$PATH

ENV PYTHONPATH $CONDA_DEFAULT_ENV/lib/python3.8/site-packages:$PYTHONPATH

WORKDIR /tmp

COPY genomehubs-${VERSION}-py3-none-manylinux2014_x86_64.whl ./

RUN pip install ./genomehubs-${VERSION}-py3-none-manylinux2014_x86_64.whl \
    && rm ./genomehubs-${VERSION}-py3-none-manylinux2014_x86_64.whl

WORKDIR /genomehubs

USER genomehubs

CMD genomehubs -h