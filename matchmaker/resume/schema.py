import uuid
from typing import Dict, List, Optional

from ninja import Field, ModelSchema, Router, Schema

from .models import HNJobPosting

# class HNJobPostingSchema(Schema):
#     whos_hiring_post: int
#     hn_id: int
#     posted_by: str
#     text: str
#     time_posted: int


class HNJobPostingSchemaOut(ModelSchema):
    # rename display_text from the model to text for the API
    # text: str = HNJobPosting.display_text
    distance: float

    class Config:
        model = HNJobPosting
        model_exclude = ["embedding", "raw_text", "embedding_text"]


class JobsOut(Schema):
    jobs: list[HNJobPostingSchemaOut]
    total_jobs: int


class CreateResumeIn(Schema):
    text: str


class CreateResumeOut(Schema):
    uuid: str


class UploadResumeOut(Schema):
    text: str

class ParseResumeTask(Schema):
    task_id: str
    
class ResumeOut(Schema):
    uuid: str
    text: str


class HiringPostOut(Schema):
    month: str
    year: int
    slug: str


class HiringPostOutList(Schema):
    hiring_posts: list[HiringPostOut]


# class TagOut(Schema):
#     name: str

class TagsOut(Schema):
    # tags: list[str]
    tags: Dict[str, List[str]]


class JobsQueryParams(Schema):
    resume_uuid: str
    month: str
    year: int
    page: int = 1
    page_size: int = 10
    distance: str = "cosine"
    order_by: str = "ascending"
    tags: str = ""
