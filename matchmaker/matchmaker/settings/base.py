"""
Django settings for matchmaker project.

Generated by 'django-admin startproject' using Django 4.1.7.

For more information on this file, see
https://docs.djangoproject.com/en/4.1/topics/settings/

For the full list of settings and their values, see
https://docs.djangoproject.com/en/4.1/ref/settings/
"""

import os
import re
from pathlib import Path

from dotenv import load_dotenv

env_file = os.environ.get("ENV_FILE")

load_dotenv(env_file)

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get("DJANGO_DEBUG", "False") == "True"


ALLOWED_HOSTS = ["*"]

CORS_ALLOWED_ORIGINS = [
  "http://localhost:3000",
    # "*"
]

CORS_ALLOW_CREDENTIALS = True


# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django_celery_beat",
    "django_extensions",
    'corsheaders',
    'django_vite',
    "resume",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    'corsheaders.middleware.CorsMiddleware',
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "matchmaker.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [
            'templates'
        ],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "matchmaker.wsgi.application"


# Database
# https://docs.djangoproject.com/en/4.1/ref/settings/#databases

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


# Password validation
# https://docs.djangoproject.com/en/4.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.1/topics/i18n/

LANGUAGE_CODE = "en-us"

TIME_ZONE = "UTC"

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.1/howto/static-files/

STATIC_URL = "/static/"
DJANGO_VITE_DEV_MODE = DEBUG

DIST_PATH = BASE_DIR / "static" / "dist"
SRC_PATH = BASE_DIR / "static" / "src"


DJANGO_VITE_ASSETS_PATH = DIST_PATH

STATIC_ROOT = BASE_DIR / "collectedstatic"
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

FRONTEND_DIR = BASE_DIR / "static" / "src"

STATICFILES_DIRS = [
    BASE_DIR / "static",
    DIST_PATH,
    SRC_PATH,
]


if DEBUG:
    STATICFILES_DIRS += [FRONTEND_DIR]

# Default primary key field type
# https://docs.djangoproject.com/en/4.1/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


CELERY_TASK_ALWAYS_EAGER = DEBUG
CELERY_TASK_EAGER_PROPAGATES = DEBUG
CELERY_BROKER_URL = os.environ.get("REDIS_URL")
CELERY_RESULT_BACKEND = os.environ.get("REDIS_URL")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_TIMEZONE = "UTC"
CELERY_TASK_REJECT_ON_WORKER_LOST = True
CELERY_TASK_TRACK_STARTED = True
CELERY_ACKS_LATE = True
CELERY_WORKER_SEND_TASK_EVENTS = True
CELERY_TASK_SEND_SENT_EVENT = True



STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

def immutable_file_test(path, url):
    # Match filename with 12 hex digits before the extension
    # e.g. app.db8f2edc0c8a.js
    return re.match(r"^.+\.[0-9a-f]{8,12}\..+$", url)


WHITENOISE_IMMUTABLE_FILE_TEST = immutable_file_test

