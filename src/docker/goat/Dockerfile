FROM genomehubs/genomehubs-ui:2.4.9
LABEL maintainer="contact@genomehubs.org"
LABEL license="MIT"

USER root

COPY genomehubs-ui-linux ./genomehubs-ui

RUN chmod 755 genomehubs-ui \
    && chown genomehubs:genomehubs genomehubs-ui

USER genomehubs

COPY .env /genomehubs/

EXPOSE 8880

CMD genomehubs-ui