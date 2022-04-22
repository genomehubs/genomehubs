FROM alpine:3.15
LABEL maintainer="contact@genomehubs.org"
LABEL license="MIT"
ARG VERSION=2.4.2
LABEL version=$VERSION

ENV CONTAINER_VERSION=$VERSION

RUN apk add --no-cache curl gcompat libstdc++ libgcc

RUN mkdir -p /genomehubs/logs

RUN addgroup -S genomehubs \
    && adduser -S genomehubs -G genomehubs \
    && chown -R genomehubs:genomehubs /genomehubs

USER genomehubs

WORKDIR /genomehubs

RUN curl -Ls https://github.com/genomehubs/genomehubs/releases/download/${VERSION}/genomehubs-api-linux > genomehubs-api \
    && chmod 755 genomehubs-api

ENV PATH /genomehubs:$PATH

COPY .env /genomehubs/

EXPOSE 3000

CMD genomehubs-api