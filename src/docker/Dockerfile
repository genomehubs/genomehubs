FROM ubuntu:20.04
LABEL maintainer="contact@genomehubs.org"
LABEL license="MIT"
ARG VERSION=2.6.7
LABEL version=$VERSION
ENV CONTAINER_VERSION=$VERSION

RUN apt-get update \
    && DEBIAN_FRONTEND="noninteractive" apt-get -y --no-install-recommends install \
    curl \
    pigz \
    pip \
    python \
    wget

RUN mkdir -p /genomehubs

RUN useradd -m genomehubs \
    && chown -R genomehubs:genomehubs /genomehubs

WORKDIR /tmp

COPY genomehubs-${VERSION}-py3-none-manylinux2014_x86_64.whl ./

RUN pip install ./genomehubs-${VERSION}-py3-none-manylinux2014_x86_64.whl \
    && rm ./genomehubs-${VERSION}-py3-none-manylinux2014_x86_64.whl

WORKDIR /genomehubs

USER genomehubs

CMD genomehubs -h