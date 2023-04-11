from django.conf import settings
from django.urls import path
from ninja import NinjaAPI

from .views import router

if settings.DEBUG:
    api = NinjaAPI()
else:
    api = NinjaAPI(openapi_url=None)

api.add_router("", router)

urlpatterns = [
    path("", api.urls),
]
