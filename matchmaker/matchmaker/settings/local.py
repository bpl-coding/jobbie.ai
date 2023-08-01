from .base import *

ALLOWED_HOSTS=['*']

DEBUG = True
DJANGO_VITE_DEV_MODE = True
PRODUCTION = False

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("DJANGO_POSTGRES_DB"),
        "USER": os.environ.get("DJANGO_POSTGRES_USER"),
        "PASSWORD": os.environ.get("DJANGO_DATABASE_PASSWORD"),
        "HOST": os.environ.get("DJANGO_DATABASE_HOST"),
        "PORT": os.environ.get("DJANGO_DATABASE_PORT"),
    }
}
