from __future__ import absolute_import, unicode_literals

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "matchmaker.settings")
app = Celery("matchmaker")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# def task(*args, **kwargs):
#     def decorator(func):
#         _task = app.task(*args, **kwargs)(func)

#         if settings.DEBUG:
#             _task.apply_async = _task.apply

#         return _task

#     return decorator