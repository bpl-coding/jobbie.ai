# FROM python:3.11-slim as prod

# WORKDIR /usr/src/app

# RUN apt update \
#     && apt install -y --no-install-recommends \
#     libpq-dev \
#     && rm -rf /var/lib/apt/lists/*

# COPY ./docker/celery/celeryd /etc/init.d/
# COPY ./docker/celery/celerybeat /etc/init.d/
# COPY ./docker/celery/config/celeryd /etc/default/

# COPY ./docker/celery-worker/entry.sh ./docker/celery-worker/entry.sh

# RUN chmod 755 /etc/init.d/celeryd && \
#     chmod 755 /etc/init.d/celerybeat && \
#     chmod 640 /etc/default/celeryd && \
#     chmod +x ./docker/celery-worker/entry.sh

# COPY ./matchmaker ./matchmaker

# COPY ./docker/celery-worker/requirements.txt ./requirements.txt

# RUN pip install --no-cache-dir -r ./requirements.txt

# ENTRYPOINT ["./docker/celery-worker/entry.sh"]


FROM python:3.10-slim as builder 

ENV DEBIAN_FRONTEND noninteractive
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV LC_ALL C.UTF-8
ENV LANG C.UTF-8

RUN pip install --upgrade pip

RUN apt update \
    && apt install -y --no-install-recommends \
    gcc \
    g++ \ 
    build-essential \
    wget \ 
    libpq-dev \
    libxslt-dev \
    zlib1g-dev \
    cmake \         
    pkg-config \    
    git \ 
    libgoogle-perftools-dev \
    && rm -rf /var/lib/apt/lists/*

USER root
RUN useradd -ms /bin/bash celery
RUN usermod -a -G celery celery
RUN usermod -a -G celery root

WORKDIR /usr/src/app
COPY ./docker/celery-worker/requirements.txt ./requirements.txt

RUN python -m venv --copies /usr/src/app/venv
RUN . /usr/src/app/venv/bin/activate && pip install --no-cache -r ./requirements.txt


# ================================

FROM python:3.10-slim as prod

ENV PATH="/usr/src/app/venv/bin:$PATH"
WORKDIR /usr/src/app

RUN apt update \
    && apt install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY ./docker/celery/celeryd /etc/init.d/
COPY ./docker/celery/celerybeat /etc/init.d/
COPY ./docker/celery/config/celeryd /etc/default/

COPY ./docker ./docker

COPY --from=builder /usr/src/app/venv /usr/src/app/venv/

RUN chmod 755 /etc/init.d/celeryd && \
    chmod 755 /etc/init.d/celerybeat && \
    chmod 640 /etc/default/celeryd && \
    chmod +x ./docker/celery-worker/entry.sh

COPY ./matchmaker ./matchmaker

ENTRYPOINT ["./docker/celery-worker/entry.sh"]
# ENTRYPOINT tail -f /dev/null