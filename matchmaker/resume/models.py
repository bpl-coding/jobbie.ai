import uuid
from datetime import datetime

from django.db import models
from django.db.models import Q
from pgvector.django import VectorField
from taggit.managers import TaggableManager


class Resume(models.Model):
    class Meta:
        app_label = "resume"

    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    text = models.TextField()
    hash = models.PositiveBigIntegerField()
    embedding = VectorField(dimensions=1536, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)


class MonthYearFilterManager(models.Manager):
    def filter_by_month_year(self, month: int | str = None, year: int | str = None):
        if month is None and year is None:
            raise ValueError("At least one of 'month' or 'year' must be provided.")

        if isinstance(month, str):
            # convert textual month to number
            month = datetime.strptime(month, "%B").month

        if isinstance(year, str):
            year = int(year)

        qs = self.all()

        if month:
            qs = qs.filter(date__month=month)
        if year:
            qs = qs.filter(date__year=year)

        return qs


class HNJobPosting(models.Model):
    class Meta:
        app_label = "resume"

    whos_hiring_post = models.ForeignKey("HNWhosHiringPost", on_delete=models.PROTECT)
    hn_id = models.IntegerField(unique=True)
    posted_by = models.CharField(max_length=200)
    time_posted = models.IntegerField()
    updated_at = models.DateTimeField(auto_now=True)
    # embedding = VectorField(dimensions=384, null=True, blank=True)
    embedding = VectorField(dimensions=1536, null=True, blank=True)

    raw_text = models.TextField()

    # text with escaped html tags such as script
    display_text = models.TextField()

    # text without html tags
    embedding_text = models.TextField()

    tags = TaggableManager()

    @staticmethod
    def matching_words(words):
        return Q(embedding_text__iregex=r'\y(' + '|'.join(words) + r')\y')
        
    @staticmethod
    def not_matching_words(words):
        return ~Q(embedding_text__iregex=r'\y(' + '|'.join(words) + r')\y')
    
    @staticmethod
    def matching_regex(regex):
        return Q(embedding_text__regex=regex)

    

class HNWhosHiringPost(models.Model):
    # manager
    objects = MonthYearFilterManager()

    class Meta:
        app_label = "resume"

    hn_id = models.IntegerField(unique=True)
    date = models.DateField()

    def __str__(self) -> str:
        return f"HNWhosHiringPost: {self.date.strftime('%B %Y')}"

    @property
    def slug(self):
        return f"{self.month.lower()}-{self.year}"

    @property
    def month(self):
        return self.date.strftime("%B")

    @property
    def year(self):
        return self.date.strftime("%Y")
