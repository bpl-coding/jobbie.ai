from datetime import datetime

from django.db import models
from pgvector.django import IvfflatIndex, VectorField

# Create your models here.


class Resume(models.Model):
    text = models.TextField()
    hash = models.PositiveBigIntegerField()
    embedding = VectorField(dimensions=1536, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)



class HNJobPosting(models.Model):
    whos_hiring_post = models.ForeignKey('HNWhosHiringPost', on_delete=models.PROTECT)
    hn_id = models.IntegerField(unique=True)
    posted_by = models.CharField(max_length=200)
    time_posted = models.IntegerField()
    updated_at = models.DateTimeField(auto_now=True)
    # embedding = VectorField(dimensions=384, null=True, blank=True)
    embedding = VectorField(dimensions=1536, null=True, blank=True)

    raw_text = models.TextField()
    display_text = models.TextField()
    embedding_text = models.TextField()

    # class Meta:
    #     indexes = [
    #         IvfflatIndex(
    #             name='hnjobposting_embedding_idx',
    #             fields=['embedding'],
    #             lists=250,
    #             opclasses=['vector_cosine_ops']
    #         )
    #     ]


class HNWhosHiringPostManager(models.Manager):
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


class HNWhosHiringPost(models.Model):
    hn_id = models.IntegerField(unique=True)
    date = models.DateField()

    def __str__(self)-> str:
        return f"HNWhosHiringPost: {self.date.strftime('%B %Y')}"
        
    # manager
    objects = HNWhosHiringPostManager()
