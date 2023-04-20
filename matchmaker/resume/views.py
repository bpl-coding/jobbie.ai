import subprocess
from datetime import datetime, timedelta
from tempfile import NamedTemporaryFile

import mmh3
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404
from ninja import File, NinjaAPI, Router
from ninja.errors import HttpError
from ninja.files import UploadedFile
from ninja.pagination import PageNumberPagination, paginate
from pgvector.django import CosineDistance, L2Distance, MaxInnerProduct

from .models import HNJobPosting, HNWhosHiringPost, Resume
from .schema import (
    CreateResumeIn,
    CreateResumeOut,
    HNJobPostingSchemaOut,
    JobsOut,
    UploadResumeOut,
)
from .tasks import get_hn_job_postings
from .utils import get_embedding
from .validators import DistanceValidator

router = Router()


@router.post(
    "resume/upload",
    tags=["resume"],
    response=UploadResumeOut
)
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

    subprocess.run(['pdftotext', pdf_buffer.name, txt_buffer.name], check=True)

    with open(txt_buffer.name, "r", encoding='utf-8', errors='replace') as f:
        text = f.read()

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
def get_jobs(
    request,
    resume_id: int,
    page: int = 1,
    page_size: int = 10,
    distance: DistanceValidator = "cosine",
):
    distance_mapping = {
        "l2": L2Distance,
        "cosine": CosineDistance,
        "maxInnerProduct": MaxInnerProduct
    }

    distance = distance_mapping[distance]

    resume = get_object_or_404(Resume, id=resume_id)
    embedding = resume.embedding

    closest_jobs = HNJobPosting.objects.filter(
        embedding__isnull=False,
        time_posted__gt=(datetime.now() - timedelta(days=30)).timestamp()
    ).exclude(
        display_text__icontains="Willing to relocate:"
    ).order_by(
        distance("embedding", embedding)
    )

    paginator = Paginator(closest_jobs, page_size)

    page_obj = paginator.get_page(page)

    closest_jobs = page_obj.object_list

    closest_jobs = [HNJobPostingSchemaOut.from_orm(job) for job in closest_jobs]

    return {"jobs": closest_jobs}


@router.post(
    "/resume",
    tags=["resume"],
    # response=MatchJobsOut,
    # response=list[HNJobPostingSchema],
    response=CreateResumeOut,
)
def create_resume(request, resume: CreateResumeIn):
    resume_text = resume.text
    embedding = get_embedding(resume_text)

    hash = mmh3.hash(resume_text, signed=False)

    print(hash)

    if Resume.objects.filter(hash=hash).exists():
        resume = Resume.objects.get(hash=hash)
    else:
        resume = Resume.objects.create(text=resume_text, embedding=embedding, hash=hash)
        resume.save()

    return {"id": resume.id}

    # closest_jobs = HNJobPosting.objects.filter(
    #     embedding__isnull=False
    # ).order_by(
    #     CosineDistance("embedding", embedding)
    # )

    # paginator = Paginator(closest_jobs, page_size)

    # page_obj = paginator.get_page(page)

    # closest_jobs = page_obj.object_list

    # print(closest_jobs)
    # print(len(closest_jobs))

    # closest_jobs = [HNJobPostingSchema.from_orm(job) for job in closest_jobs]

    # return closest_jobs

    # closest_jobs = HNJobPosting.objects.filter(
    #     embedding__isnull=False
    # ).order_by(
    #     CosineDistance("embedding", embedding)
    # )[:10]

    # convert to schema
    # HNJobPostingSchema
    # closest_jobs = [HNJobPostingSchema(**dict(job)) for job in closest_jobs] this is not working
    # print(closest_jobs)
    # for job in closest_jobs:
    # print(job.whos_hiring_post)
    # print(dict(job))
    # print django model object as dict without using __dict__

    # print(job.__dict__)

    # closest_jobs = [HNJobPostingSchema.from_orm(job) for job in closest_jobs]

    # return {
    #     'jobs': closest_jobs
    # }
