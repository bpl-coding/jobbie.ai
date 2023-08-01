from django.conf import settings
from django.views.generic import TemplateView
from resume.models import HNWhosHiringPost
from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import get_user_model
from django.views import generic

User = get_user_model()

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

class SignUpForm(UserCreationForm):
    class Meta:
        model = User
        fields = ('username', 'password1', 'password2', )

class SignUpView(generic.CreateView):
    form_class = SignUpForm
    template_name = 'signup.html'
    success_url = '/'