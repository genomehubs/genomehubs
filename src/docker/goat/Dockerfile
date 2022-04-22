FROM genomehubs/genomehubs-ui:2.4.3
LABEL maintainer="contact@genomehubs.org"
LABEL license="MIT"

USER root

RUN apk add --no-cache git

USER genomehubs

WORKDIR /genomehubs

RUN git clone https://github.com/genomehubs/goat-ui

RUN mv goat-ui/static ./local/ \
    && rm -rf goat-ui

ENV PATH /genomehubs:$PATH

COPY .env /genomehubs/

EXPOSE 8880

CMD genomehubs-ui