FROM python:3.11-slim as prod

WORKDIR /usr/src/app

RUN apt update \
    && apt install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY ./docker/celery/celeryd /etc/init.d/
COPY ./docker/celery/celerybeat /etc/init.d/
COPY ./docker/celery/config/celeryd /etc/default/

COPY ./docker/celery-worker/entry.sh ./docker/celery-worker/entry.sh

RUN chmod 755 /etc/init.d/celeryd && \
    chmod 755 /etc/init.d/celerybeat && \
    chmod 640 /etc/default/celeryd && \
    chmod +x ./docker/celery-worker/entry.sh

COPY ./matchmaker ./matchmaker

ENTRYPOINT ["./docker/celery-worker/entry.sh"]
