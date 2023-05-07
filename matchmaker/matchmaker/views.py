from django.conf import settings
from django.views.generic import TemplateView
from resume.models import HNWhosHiringPost


class FrontendView(TemplateView):
    template_name = "index.html"

    def get_context_data(self, **kwargs):
        hiring_posts = [
            {
                'month':post.month,
                'year':post.year,
                "slug":post.slug,
            }
            for post in HNWhosHiringPost.objects.all().order_by("-date")
        ]

        return {
            "hiring_posts": hiring_posts,
            "DEBUG": settings.DEBUG,
        }