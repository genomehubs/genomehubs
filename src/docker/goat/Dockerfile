FROM genomehubs/genomehubs-ui:2.4.7
LABEL maintainer="contact@genomehubs.org"
LABEL license="MIT"

COPY genomehubs-ui-linux ./genomehubs-ui

RUN chmod 755 genomehubs-ui

COPY .env /genomehubs/

EXPOSE 8880

CMD genomehubs-ui