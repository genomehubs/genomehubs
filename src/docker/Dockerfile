FROM ubuntu:20.04
LABEL maintainer="contact@genomehubs.org"
LABEL license="MIT"
ARG VERSION=2.3.0
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

RUN pip install genomehubs==${VERSION}

USER genomehubs

CMD genomehubs -h