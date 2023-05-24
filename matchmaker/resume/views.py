import string
import subprocess
from datetime import datetime, timedelta
from tempfile import NamedTemporaryFile
from typing import List

import mmh3
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404
from ninja import File, NinjaAPI, Query, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile
from ninja.pagination import PageNumberPagination, paginate
from pgvector.django import CosineDistance, L2Distance, MaxInnerProduct
from taggit.models import Tag

from .models import HNJobPosting, HNWhosHiringPost, Resume
from .schema import (
    CreateResumeIn,
    CreateResumeOut,
    HiringPostOut,
    HiringPostOutList,
    HNJobPostingSchemaOut,
    JobsOut,
    JobsQueryParams,
    ResumeOut,
    TagsOut,
    UploadResumeOut,
)
from .tasks import get_hn_job_postings
from .utils import get_embedding
from .validators import DistanceValidator

router = Router()



@router.post("resume/upload", tags=["resume"], response=UploadResumeOut)
def resume_pdf_to_text(request, file: UploadedFile = File(...)):
    # Reject files larger than 2MB
    max_file_size = 2 * 1024 * 1024  # 2MB in bytes
    if file.size > max_file_size:
        raise HttpError(413, "File size should not exceed 2MB")

    # Reject files that are not PDFs
    if file.content_type != "application/pdf":
        raise HttpError(415, "File must be a PDF")

    pdf_buffer = NamedTemporaryFile(suffix=".pdf")
    pdf_buffer.write(file.read())

    txt_buffer = NamedTemporaryFile(suffix=".txt")

    subprocess.run(["pdftotext", pdf_buffer.name, txt_buffer.name], check=True)

    with open(txt_buffer.name, "r", encoding="utf-8", errors="replace") as f:
        text = f.read()

    # Remove non-printable characters
    text = ''.join(filter(lambda x: x in string.printable and x != '\f', text))

    pdf_buffer.close()
    txt_buffer.close()

    return {"text": text}


@router.get(
    "jobs",
    response={
        200: JobsOut,
        404: None,
    },
    tags=["jobs"],
)
def get_jobs(request, params: JobsQueryParams = Query(...)):
    distance_mapping = {
        "l2": L2Distance,
        "cosine": CosineDistance,
        "maxInnerProduct": MaxInnerProduct,
    }

    distance = distance_mapping[params.distance]

    resume = get_object_or_404(Resume, hash=params.resume_id)
    embedding = resume.embedding

    hiring_post = HNWhosHiringPost.objects.filter_by_month_year(month=params.month, year=params.year).first()

    closest_jobs = (
        HNJobPosting.objects.filter(
            embedding__isnull=False,
            whos_hiring_post=hiring_post,
        )
        .annotate(distance=distance("embedding", embedding))
        .exclude(display_text__icontains="Willing to relocate:")
    )

    if params.tags:

        # here we're ORing the tags within a category
        # and ANDing across categories
        # for example, full-time OR part-time AND python OR javascript
        param_tags = params.tags.split(',')

        categories = set(tag.split(':')[0] for tag in param_tags)

        tags = {category: [] for category in categories}

        for tag in param_tags:
            category, tag_name = tag.split(':')
            tags[category].append(tag)
        
        for category, tags in tags.items():
            closest_jobs = closest_jobs.filter(tags__name__in=tags)



    if params.order_by == "ascending":
        closest_jobs = closest_jobs.order_by(distance("embedding", embedding))
    elif params.order_by == "descending":
        closest_jobs = closest_jobs.order_by(-distance("embedding", embedding))
    
    closest_jobs = closest_jobs.distinct()

    total_jobs = closest_jobs.count()

    paginator = Paginator(closest_jobs, params.page_size)

    page_obj = paginator.get_page(params.page)

    closest_jobs = page_obj.object_list

    closest_jobs = [HNJobPostingSchemaOut.from_orm(job) for job in closest_jobs]

    return {"jobs": closest_jobs, "total_jobs": total_jobs}


@router.post(
    "/resume",
    tags=["resume"],
    response=CreateResumeOut,
)
def create_resume(request, resume: CreateResumeIn):
    resume_text = resume.text
    embedding = get_embedding(resume_text)

    hash = mmh3.hash(resume_text, signed=False)

    if Resume.objects.filter(hash=hash).exists():
        resume = Resume.objects.get(hash=hash)
    else:
        resume = Resume.objects.create(text=resume_text, embedding=embedding, hash=hash)
        resume.save()

    return {"id": resume.hash}


@router.get("/resume/{resume_id}", tags=["resume"], response=ResumeOut)
def get_resume(request, resume_id: int):
    resume = get_object_or_404(Resume, hash=resume_id)
    return ResumeOut(id=resume.hash, text=resume.text)

@router.get("/tags", tags=["tags"], response=TagsOut)
def get_tags(request):

    all_tags = [tag.name for tag in Tag.objects.all()]

    categories = set(tag.split(':')[0] for tag in all_tags)

    tags = {category: [] for category in categories}

    for tag in all_tags:
        category, tag_name = tag.split(':')
        tags[category].append(tag_name)


    return {"tags": tags}