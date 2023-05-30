FROM genomehubs/genomehubs-dependencies:latest

RUN mkdir -p /genomehubs/tests

USER root

WORKDIR /tmp

COPY genomehubs-*-py3-none-manylinux2014_x86_64.whl ./

RUN pip install ./genomehubs-*-py3-none-manylinux2014_x86_64.whl \
    && rm ./genomehubs-*-py3-none-manylinux2014_x86_64.whl

WORKDIR /genomehubs

COPY genomehubs-api-linux /genomehubs/genomehubs-api

RUN chmod 755 genomehubs-api

USER genomehubs

CMD genomehubs -h