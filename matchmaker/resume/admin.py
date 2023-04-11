from django.contrib import admin

from .models import HNJobPosting, HNWhosHiringPost, Resume

# Register your models here.


admin.site.register(HNJobPosting)
admin.site.register(HNWhosHiringPost)
admin.site.register(Resume)