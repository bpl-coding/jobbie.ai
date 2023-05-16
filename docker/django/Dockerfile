FROM node:19-slim as frontend-builder

WORKDIR /usr/src/app

COPY package.json yarn.lock tsconfig.json tsconfig.node.json tailwind.config.js postcss.config.js vite.config.ts openapi-config.ts ./

RUN yarn install

COPY ./matchmaker/static/src ./matchmaker/static/src

RUN yarn build

# ================================

FROM python:3.10 as django-builder

SHELL ["/bin/bash", "-c"] 

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get -y upgrade && \
    apt-get install -y --no-install-recommends \
        gcc \
        g++ \
        build-essential \
        wget \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY ./docker/django/requirements.txt ./requirements.txt

RUN python -m venv --copies /usr/src/app/venv
RUN . /usr/src/app/venv/bin/activate && pip install --no-cache -r ./requirements.txt

# ================================

FROM python:3.10-slim as server

ENV PATH="/usr/src/app/venv/bin:$PATH"
WORKDIR /usr/src/app

RUN apt update \
        && apt install -y --no-install-recommends \ 
        libpq-dev \
        wget \
        fontconfig \ 
    && rm -rf /var/lib/apt/lists/*

# Download xpdf-tools-linux, extract and install pdftotext
RUN wget https://dl.xpdfreader.com/xpdf-tools-linux-4.04.tar.gz \
    && tar -xzf xpdf-tools-linux-4.04.tar.gz \
    && mv xpdf-tools-linux-4.04/bin64/pdftotext /usr/bin/ \
    && rm -rf xpdf-tools-linux-4.04 xpdf-tools-linux-4.04.tar.gz

COPY ./matchmaker ./matchmaker
COPY ./docker/django ./docker/django

COPY --from=django-builder /usr/src/app/venv /usr/src/app/venv/
COPY --from=frontend-builder /usr/src/app/matchmaker/static/dist ./matchmaker/static/dist

EXPOSE 8888
RUN chmod +x ./docker/django/entry.sh

CMD ./docker/django/entry.sh