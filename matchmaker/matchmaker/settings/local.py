from .base import *

DEBUG = True
ALLOWED_HOSTS=['*']

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DJANGO_POSTGRES_DB"),
        "USER": os.environ.get("DJANGO_POSTGRES_USER"),
        "PASSWORD": os.environ.get("DJANGO_DATABASE_PASSWORD"),
        "HOST": 'localhost',
        "PORT": os.environ.get("DJANGO_DATABASE_PORT"),
    }
}
