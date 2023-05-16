#!/usr/bin/env bash
set -e

cd ./matchmaker
python manage.py migrate
python manage.py collectstatic --clear --noinput --ignore src/*

rm -rf /usr/src/app/logs/
mkdir /usr/src/app/logs/
touch /usr/src/app/logs/gunicorn.log
touch /usr/src/app/logs/access.log

# tail -f /dev/null

DJANGO_SETTINGS_MODULE=$DJANGO_SETTINGS_MODULE exec gunicorn matchmaker.wsgi:application -w 2 -b :8888 --reload --access-logfile - --error-logfile - --log-level debug