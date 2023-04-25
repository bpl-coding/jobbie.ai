import html
import logging
import os
from datetime import datetime
from functools import partial

# from html_sanitizer import Sanitizer
import nh3
import openai
from django.db import IntegrityError

from matchmaker.celery import app

from .models import HNJobPosting, HNWhosHiringPost
from .utils import fetch, get_embedding

logger = logging.getLogger(__name__)

openai.api_key = os.environ.get("OPENAI_API_KEY")

def update_embeddings_for_job_postings(force=False):

    global get_embedding

    jobs = HNJobPosting.objects.all()

    if not force:
        jobs = jobs.filter(embedding__isnull=True)
    
    corpus = [job.embedding_text for job in jobs]


    corpus_embeddings = [get_embedding(text) for text in corpus]

    for job, embedding in zip(jobs, corpus_embeddings):
        job.embedding = embedding

    HNJobPosting.objects.bulk_update(jobs, ["embedding"])


# function to index all job postings up to a certain month/year
@app.task
def index_job_postings(month: str | int, year: int):
    
    # convert month to a number if it's a string
    if isinstance(month, str):
        month = datetime.strptime(month, "%B").month
        
    story_ids = fetch_latest_stories_from_user("whoishiring", 500)

    for story_id in story_ids:

        story = fetch_story_by_id(story_id)

        if is_whos_hiring_post(story):

            date = datetime.fromtimestamp(story["time"])

            # break if we've reached anything before the month/year we're looking for
            if date.year < year or (date.year == year and date.month < month):
                break

            print(f"Indexing: 'Who's Hiring' post: {story['title']} (id: {story['id']})")

            post, created = HNWhosHiringPost.objects.get_or_create(
                hn_id=story["id"], date=datetime.fromtimestamp(story["time"])
            )
       



@app.task
def get_hn_job_postings(month: str | int, year: int, update_posts=False, update_embeddings=False):

    # convert month to a number if it's a string
    if isinstance(month, str):
        month = datetime.strptime(month, "%B").month
    
    # check if we've already indexed the job postings for this month/year
    # if not HNWhosHiringPost.objects.filter_by_month_year(month, year).exists():
        # index_job_postings(month, year)
    
    # get the post for the month/year
    post = HNWhosHiringPost.objects.filter_by_month_year(month, year).first()

    job_postings = process_story_for_job_postings(post.hn_id, update_posts)

    HNJobPosting.objects.bulk_create(job_postings, ignore_conflicts=True)
    update_embeddings_for_job_postings(update_embeddings)



def fetch_latest_stories_from_user(user: str, count: int)->list[str]:
    user_url = f"https://hacker-news.firebaseio.com/v0/user/{user}/submitted.json"
    latest_post_ids = fetch(user_url)[:count]
    return latest_post_ids



def process_story_for_job_postings(story_id, update=False):
    job_postings = []

    story = fetch_story_by_id(story_id)

    if is_whos_hiring_post(story):
        print(f"Getting Jobs: 'Who's Hiring' post: {story['title']} (id: {story['id']})")

        post, created = HNWhosHiringPost.objects.get_or_create(
            hn_id=story["id"], date=datetime.fromtimestamp(story["time"])
        )

        job_comment_ids = story.get("kids", [])

        if not update:
            existing_jobs_postings = HNJobPosting.objects.filter(whos_hiring_post=post)     

            existing_comment_ids = set(existing_jobs_postings.values_list('hn_id', flat=True))

            # Use list comprehension to filter out existing IDs
            job_comment_ids = [comment_id for comment_id in job_comment_ids if comment_id not in existing_comment_ids]

        comments = fetch_comments_from_story(job_comment_ids)
        job_postings.extend(create_job_postings_from_comments(post, comments))

    return job_postings


def fetch_story_by_id(story_id:str)->dict:
    story_url = (
        f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json?print=pretty"
    )

    return fetch(story_url)


def is_whos_hiring_post(story: dict)->bool:
    return (
        story
        and story.get("type") == "story"
        and "who is hiring" in story.get("title", "").lower()
    )


def fetch_comments_from_story(comment_ids:list[str])->list[dict]:
    comments = []

    for comment_id in comment_ids:
        comment_url = (
            f"https://hacker-news.firebaseio.com/v0/item/{comment_id}.json?print=pretty"
        )
        comment = fetch(comment_url)
        comments.append(comment)

    return comments


# def create_job_postings_from_comments(post: HNWhosHiringPost, comments: list[dict])->list[HNJobPosting]:
#     job_postings = []

#     for comment in comments:
#         if comment and not comment.get("dead") and not comment.get("deleted"):
#             # try:
#             job_posting = HNJobPosting.objects.update_or_create(
#                 whos_hiring_post=post,
#                 posted_by=comment["by"],
#                 hn_id=comment["id"],
#                 raw_text=comment["text"],
#                 display_text=nh3.clean(comment["text"]),
#                 embedding_text=clean_text(comment["text"]),
#                 time_posted=comment["time"],
#             )
#             # except IntegrityError:
#             #     continue
#             job_postings.append(job_posting)

#     return job_postings

def create_job_postings_from_comments(post: HNWhosHiringPost, comments: list[dict])->list[HNJobPosting]:
    job_postings = []
    processed_hn_ids = set()

    for comment in comments:
        hn_id = comment.get("id")

        if comment and not comment.get("dead") and not comment.get("deleted") and hn_id not in processed_hn_ids:
            processed_hn_ids.add(hn_id)
            job_posting, _ = HNJobPosting.objects.update_or_create(
                whos_hiring_post=post,
                posted_by=comment["by"],
                hn_id=hn_id,
                defaults={
                    "raw_text": comment["text"],
                    "display_text": nh3.clean(comment["text"]),
                    "embedding_text": clean_text(comment["text"]),
                    "time_posted": comment["time"],
                }
            )
            job_postings.append(job_posting)

    return job_postings



def clean_text(text: str)->str:
    soup = BeautifulSoup(text, 'html.parser')
    
    # Replace <a> elements with their href values
    for a in soup.find_all('a'):
        a.replace_with(a['href'])

    # Add newline at the beginning of each <p> tag
    for p in soup.find_all('p'):
        p.insert_before('\n')
        p.unwrap()
    
    # Get the cleaned text
    cleaned_text = soup.get_text()
    
    # Unescape any HTML entities
    cleaned_text = html.unescape(cleaned_text)
    
    return cleaned_text.strip()
