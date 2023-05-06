from ninja import ModelSchema, Schema

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
        model_exclude = ['embedding']

class JobsOut(Schema):
    jobs: list[HNJobPostingSchemaOut]
    total_jobs: int

class CreateResumeIn(Schema):
    text: str

class CreateResumeOut(Schema):
    id: int

class UploadResumeOut(Schema):
    text: str

class ResumeOut(Schema):
    id: int
    text: str