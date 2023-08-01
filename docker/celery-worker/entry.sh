#!/usr/bin/env bash
set -e

cd ./matchmaker

echo "Starting celery worker"

exec watchmedo auto-restart -d . -p '*.py' --recursive -- celery -A matchmaker worker --loglevel=debug --beat -Q celery --loglevel=debug --concurrency=4 --scheduler django_celery_beat.schedulers:DatabaseScheduler -n worker 

```