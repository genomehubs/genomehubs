FROM alpine:3.15
LABEL maintainer="contact@genomehubs.org"
LABEL license="MIT"
ARG VERSION=genomehubs/genomehubs-ui:2.5.35
LABEL version=$VERSION

ENV CONTAINER_VERSION=$VERSION

RUN apk add --no-cache curl gcompat libstdc++ libgcc

RUN mkdir -p /genomehubs/local

COPY genomehubs-ui-linux /genomehubs/genomehubs-ui

RUN addgroup -S genomehubs \
    && adduser -S genomehubs -G genomehubs \
    && chown -R genomehubs:genomehubs /genomehubs

USER genomehubs

WORKDIR /genomehubs

RUN chmod 755 genomehubs-ui

ENV PATH /genomehubs:$PATH

COPY .env /genomehubs/

EXPOSE 8880

CMD genomehubs-ui