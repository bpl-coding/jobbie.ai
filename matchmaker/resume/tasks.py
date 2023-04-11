import html
import os
from datetime import datetime
from functools import partial

import openai
import torch
from bs4 import BeautifulSoup
from django.db import IntegrityError

from sentence_transformers import SentenceTransformer

from matchmaker.celery import app

from .models import HNJobPosting, HNWhosHiringPost
from .utils import fetch, get_embedding

import logging

logger = logging.getLogger(__name__)

openai.api_key = os.environ.get("OPENAI_API_KEY")

def update_embeddings_for_job_postings(force=False):

    global get_embedding

    jobs = HNJobPosting.objects.all()

    if not force:
        jobs = jobs.filter(embedding__isnull=True)
    
    corpus = [job.text for job in jobs]


    corpus_embeddings = [get_embedding(text) for text in corpus]

    for job, embedding in zip(jobs, corpus_embeddings):
        job.embedding = embedding

    HNJobPosting.objects.bulk_update(jobs, ["embedding"])




@app.task
def get_hn_job_postings():
    story_ids = fetch_latest_stories_from_user("whoishiring", 500)
    job_postings = process_stories_for_job_postings(story_ids, 1)
    HNJobPosting.objects.bulk_create(job_postings, ignore_conflicts=True)
    update_embeddings_for_job_postings()



def fetch_latest_stories_from_user(user: str, count: int)->list[str]:
    user_url = f"https://hacker-news.firebaseio.com/v0/user/{user}/submitted.json"
    latest_post_ids = fetch(user_url)[:count]
    return latest_post_ids


def process_stories_for_job_postings(story_ids, months):
    job_postings = []

    for story_id in story_ids:

        # check if the story_id is already in the db
        if HNWhosHiringPost.objects.filter(hn_id=story_id).exists():
            logger.info(f"Skipping story {story_id}")
            continue

        story = fetch_story_by_id(story_id)

        if is_whos_hiring_post(story):
            print(f"Latest 'Who's Hiring' post: {story['title']} (id: {story['id']})")

            post, created = HNWhosHiringPost.objects.get_or_create(
                hn_id=story["id"], date=datetime.fromtimestamp(story["time"])
            )

            comments = fetch_comments_from_story(story)
            job_postings.extend(create_job_postings_from_comments(post, comments))

            months -= 1
            if months <= 0:
                break

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


def fetch_comments_from_story(story:str)->list[dict]:
    comments = []

    for comment_id in story["kids"]:
        comment_url = (
            f"https://hacker-news.firebaseio.com/v0/item/{comment_id}.json?print=pretty"
        )
        comment = fetch(comment_url)
        comments.append(comment)

    return comments


def create_job_postings_from_comments(post: HNWhosHiringPost, comments: list[dict])->list[HNJobPosting]:
    job_postings = []

    for comment in comments:
        if comment and not comment.get("dead") and not comment.get("deleted"):
            try:
                job_posting = HNJobPosting.objects.create(
                    whos_hiring_post=post,
                    posted_by=comment["by"],
                    hn_id=comment["id"],
                    text=clean_text(comment["text"]),
                    time_posted=comment["time"],
                )
            except IntegrityError:
                continue
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
