from django.conf import settings
from django.views.generic import TemplateView


class FrontendView(TemplateView):
    template_name = "index.html"

    def get_context_data(self, **kwargs):
        kwargs["DEBUG"] = settings.DEBUG
        return super().get_context_data(**kwargs)