from django.contrib import admin

from .models import HNJobPosting, HNWhosHiringPost, Resume

# Register your models here.




class HNJobPostingAdmin(admin.ModelAdmin):
   model = HNJobPosting
   # exclude = ['embedding']


class ResumeAdmin(admin.ModelAdmin):
   model = Resume
   # exclude = ['embedding']


admin.site.register(HNJobPosting, HNJobPostingAdmin)
admin.site.register(HNWhosHiringPost)
admin.site.register(Resume, ResumeAdmin)