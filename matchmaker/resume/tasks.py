import html
import logging
import os
from datetime import datetime
from functools import partial

import nh3
import openai
from bs4 import BeautifulSoup
from django.db import IntegrityError
from taggit.models import Tag

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

            print(
                f"Indexing: 'Who's Hiring' post: {story['title']} (id: {story['id']})"
            )

            post, created = HNWhosHiringPost.objects.get_or_create(
                hn_id=story["id"], date=datetime.fromtimestamp(story["time"])
            )


@app.task
def get_hn_job_postings(
    month: str | int, year: int, update_posts=False, update_embeddings=False
):
    # convert month to a number if it's a string
    if isinstance(month, str):
        month = datetime.strptime(month, "%B").month

    # check if we've already indexed the job postings for this month/year
    if not HNWhosHiringPost.objects.filter_by_month_year(month, year).exists():
        index_job_postings(month, year)

    # get the post for the month/year
    post = HNWhosHiringPost.objects.filter_by_month_year(month, year).first()

    job_postings = process_story_for_job_postings(post.hn_id, update_posts)

    HNJobPosting.objects.bulk_create(job_postings, ignore_conflicts=True)
    update_embeddings_for_job_postings(update_embeddings)

    populate_tags()


def fetch_latest_stories_from_user(user: str, count: int) -> list[str]:
    user_url = f"https://hacker-news.firebaseio.com/v0/user/{user}/submitted.json"
    latest_post_ids = fetch(user_url)[:count]
    return latest_post_ids


def process_story_for_job_postings(story_id, update=False):
    job_postings = []

    story = fetch_story_by_id(story_id)

    if is_whos_hiring_post(story):
        print(
            f"Getting Jobs: 'Who's Hiring' post: {story['title']} (id: {story['id']})"
        )

        post, created = HNWhosHiringPost.objects.get_or_create(
            hn_id=story["id"], date=datetime.fromtimestamp(story["time"])
        )

        job_comment_ids = story.get("kids", [])

        if not update:
            existing_jobs_postings = HNJobPosting.objects.filter(whos_hiring_post=post)

            existing_comment_ids = set(
                existing_jobs_postings.values_list("hn_id", flat=True)
            )

            # Use list comprehension to filter out existing IDs
            job_comment_ids = [
                comment_id
                for comment_id in job_comment_ids
                if comment_id not in existing_comment_ids
            ]

        comments = fetch_comments_from_story(job_comment_ids)
        job_postings.extend(create_job_postings_from_comments(post, comments))

    return job_postings


def fetch_story_by_id(story_id: str) -> dict:
    story_url = (
        f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json?print=pretty"
    )

    return fetch(story_url)


def is_whos_hiring_post(story: dict) -> bool:
    return (
        story
        and story.get("type") == "story"
        and "who is hiring" in story.get("title", "").lower()
    )


def fetch_comments_from_story(comment_ids: list[str]) -> list[dict]:
    comments = []

    for comment_id in comment_ids:
        comment_url = (
            f"https://hacker-news.firebaseio.com/v0/item/{comment_id}.json?print=pretty"
        )
        comment = fetch(comment_url)
        comments.append(comment)

    return comments


def create_job_postings_from_comments(
    post: HNWhosHiringPost, comments: list[dict]
) -> list[HNJobPosting]:
    job_postings = []
    processed_hn_ids = set()

    for comment in comments:
        hn_id = comment.get("id")

        if (
            comment
            and not comment.get("dead")
            and not comment.get("deleted")
            and hn_id not in processed_hn_ids
        ):
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
                },
            )
            job_postings.append(job_posting)

    return job_postings


def clean_text(text: str) -> str:
    soup = BeautifulSoup(text, "html.parser")

    # Replace <a> elements with their href values
    for a in soup.find_all("a"):
        a.replace_with(a["href"])

    # Add newline at the beginning of each <p> tag
    for p in soup.find_all("p"):
        p.insert_before("\n")
        p.unwrap()

    # Get the cleaned text
    cleaned_text = soup.get_text()

    # Unescape any HTML entities
    cleaned_text = html.unescape(cleaned_text)

    return cleaned_text.strip()



def populate_tags():
    # fmt: off
    finders = {
        'arrangement': {
            'remote':  HNJobPosting.matching_regex('(full?.remote)|(100%\sremote|remote)') &
                        HNJobPosting.not_matching_words(['No Remote', 'On-site', 'Onsite', 'In Person']) ,
            'in-person' : HNJobPosting.matching_words(['No Remote', 'In Person', 'Office']) | 
                           HNJobPosting.matching_regex('on[-\s]site') | 
                           HNJobPosting.matching_regex('in[-\s]person') & 
                           HNJobPosting.not_matching_words(['Remote']),
            'hybrid': HNJobPosting.matching_words(['Hybrid', 'Partial Remote', 'Partial WFH', 'Partial Work From Home'])                           
        },
        'technology': {
            'android': HNJobPosting.matching_words(['android']),
            'angular': HNJobPosting.matching_words(['angular', 'angularjs']),
            'c': HNJobPosting.matching_regex(r'\sC(,\s|\.\s|/)'),
            'clojure': HNJobPosting.matching_words(['clojure']),
            'cplusplus': HNJobPosting.matching_words([r'c\+\+', 'cpp']),
            'csharp': HNJobPosting.matching_words(['c#', 'csharp']),
            'dart': HNJobPosting.matching_words(['dart', 'flutter']),
            'elixir': HNJobPosting.matching_words(['elixir']),
            'elm': HNJobPosting.matching_words(['elm']),
            'ember': HNJobPosting.matching_words(['ember', 'emberjs']),
            'flutter': HNJobPosting.matching_words(['flutter']),
            'go': HNJobPosting.matching_words(['golang']) | HNJobPosting.matching_regex(r'\yGo\y'),
            'haskell': HNJobPosting.matching_words(['haskell']),
            'ios': HNJobPosting.matching_words(['ios']),
            'java': HNJobPosting.matching_words(['java']),
            'javascript': HNJobPosting.matching_words(['javascript']),
            'julia': HNJobPosting.matching_words(['julia']),
            'kotlin': HNJobPosting.matching_words(['kotlin']),
            'kubernetes': HNJobPosting.matching_words(['kubernetes', 'k8s']),
            'lua': HNJobPosting.matching_words(['lua']),
            'node': HNJobPosting.matching_words(['node', 'nodejs']),
            'ocaml': HNJobPosting.matching_words(['ocaml']),
            'perl': HNJobPosting.matching_words(['perl']),
            'php': HNJobPosting.matching_words(['php']),
            'python': HNJobPosting.matching_words(['python']),
            'python-django': HNJobPosting.matching_words(['django']),
            'python-flask': HNJobPosting.matching_words(['flask']),
            'python-fastapi': HNJobPosting.matching_words(['fastapi']),
            'rails': HNJobPosting.matching_words(['rails', 'ror']),
            'react': HNJobPosting.matching_regex(r'\yreact\y(?!(-|\s)native)') | HNJobPosting.matching_words(['reactjs']),
            'react-native': HNJobPosting.matching_words(['react-native']) | HNJobPosting.matching_regex(r'react native'),
            'ruby': HNJobPosting.matching_words(['ruby', 'rails', 'ror']),
            'rust': HNJobPosting.matching_words(['rust']),
            'scala': HNJobPosting.matching_words(['scala']),
            'swift': HNJobPosting.matching_words(['swift']),
            'typescript': HNJobPosting.matching_words(['typescript']),
            'vue': HNJobPosting.matching_words(['vue', 'vuejs']),
            'wasm': HNJobPosting.matching_words(['wasm', 'webassembly']),
        },
        'location': {
            'amsterdam': HNJobPosting.matching_words(['Amsterdam']),
            'ann-arbor': HNJobPosting.matching_words(['Ann Arbor']),
            'antwerp': HNJobPosting.matching_words(['Antwerp']),
            'atlanta': HNJobPosting.matching_words(['Atlanta']),
            'auckland': HNJobPosting.matching_words(['Auckland']),
            'austin': HNJobPosting.matching_words(['Austin']),
            'bangalore': HNJobPosting.matching_words(['Bangalore', 'Bengaluru']),
            'bangkok': HNJobPosting.matching_words(['Bangkok']),
            'barcelona': HNJobPosting.matching_words(['Barcelona']),
            'beijing': HNJobPosting.matching_words(['Beijing']),
            'berkeley': HNJobPosting.matching_words(['Berkeley']),
            'berlin': HNJobPosting.matching_words(['Berlin']),
            'bogota': HNJobPosting.matching_words(['Bogotá']),
            'boston': HNJobPosting.matching_words(['Boston']),
            'boulder': HNJobPosting.matching_words(['Boulder']),
            'braga': HNJobPosting.matching_words(['Braga']),
            'bratislava': HNJobPosting.matching_words(['Bratislava']),
            'brooklyn': HNJobPosting.matching_words(['Brooklyn']),
            'brussels': HNJobPosting.matching_words(['Brussels']),
            'budapest': HNJobPosting.matching_words(['Budapest']),
            'burlingame': HNJobPosting.matching_words(['Burlingame']),
            'cambridge-ma': HNJobPosting.matching_regex(r'\yCambridge\y(?!(,\s|\s)uk)'),
            'cambridge-uk': HNJobPosting.matching_words(['Cambridge UK', 'Cambridge, UK', 'Cambridgeshire']),
            'cape-town': HNJobPosting.matching_words(['Cape Town']),
            'charlotte': HNJobPosting.matching_words(['Charlotte']),
            'chennai': HNJobPosting.matching_words(['Chennai']),
            'chicago': HNJobPosting.matching_words(['Chicago']),
            'cologne': HNJobPosting.matching_words(['Cologne', 'Köln']),
            'cupertino': HNJobPosting.matching_words(['Cupertino']),
            'dallas': HNJobPosting.matching_words(['Dallas']),
            'dc': HNJobPosting.matching_words(['DC', 'D.C.']),
            'denver': HNJobPosting.matching_words(['Denver']),
            'detroit': HNJobPosting.matching_words(['Detroit']),
            'dubai': HNJobPosting.matching_words(['Dubai']),
            'dublin': HNJobPosting.matching_words(['Dublin']),
            'durham': HNJobPosting.matching_words(['Durham']),
            'edinburgh': HNJobPosting.matching_words(['Edinburgh']),
            'eindhoven': HNJobPosting.matching_words(['Eindhoven']),
            'emeryville': HNJobPosting.matching_words(['Emeryville']),
            'geneve': HNJobPosting.matching_words(['Geneve']),
            'ghent': HNJobPosting.matching_words(['Ghent']),
            'guadalajara': HNJobPosting.matching_words(['Guadalajara']),
            'hong-kong': HNJobPosting.matching_words(['Hong Kong']),
            'hangzhou': HNJobPosting.matching_words(['Hangzhou']),
            'houston': HNJobPosting.matching_words(['Houston']),
            'hyderabad': HNJobPosting.matching_words(['Hyderabad']),
            'irvine': HNJobPosting.matching_words(['Irvine']),
            'lausanne': HNJobPosting.matching_words(['Lausanne']),
            'kansas-city': HNJobPosting.matching_words(['Kansas City']),
            'knoxville': HNJobPosting.matching_words(['Knoxville']),
            'leuven': HNJobPosting.matching_words(['Leuven']),
            'lincoln': HNJobPosting.matching_words(['Lincoln']),
            'lisbon': HNJobPosting.matching_words(['Lisbon']),
            'la': (HNJobPosting.matching_regex('\yLA\y') | HNJobPosting.matching_words(['Los Angeles', 'Santa Monica', 'Pasadena', 'Venice', 'Culver City'])) & (HNJobPosting.not_matching_words(['New Orleans, LA'])),
            'london': HNJobPosting.matching_words(['London']),
            'los-gatos': HNJobPosting.matching_words(['Los Gatos']),
            'madrid': HNJobPosting.matching_words(['Madrid']),
            'manila': HNJobPosting.matching_words(['Manila']),
            'melbourne-au': HNJobPosting.matching_words(['Melbourne, AU', 'Melbourne, Australia']),
            'melbourne-fl': HNJobPosting.matching_words(['Melbourne']) & 
                HNJobPosting.not_matching_words(['Melbourne, AU', 'Melbourne, Australia']),
            'menlo-park': HNJobPosting.matching_words(['Menlo Park']),
            'mexico-city': HNJobPosting.matching_words(['Mexico City']),
            'mountain-view': HNJobPosting.matching_words(['Mountain View']),
            'montreal': HNJobPosting.matching_words(['Montreal']),
            'munich': HNJobPosting.matching_words(['Munich']),
            'nyc': HNJobPosting.matching_words(['New York', 'NYC']),
            'oakland': HNJobPosting.matching_words(['Oakland']),
            'oslo': HNJobPosting.matching_words(['Oslo']),
            'oxford': HNJobPosting.matching_words(['Oxford']),
            'palo-alto': HNJobPosting.matching_words(['Palo Alto']),
            'paris': HNJobPosting.matching_words(['Paris']),
            'phoenix-az': HNJobPosting.matching_words(['Phoenix, AZ', 'Phoenix, Arizona']),
            'philadelphia': HNJobPosting.matching_words(['Philadelphia']),
            'pittsburgh': HNJobPosting.matching_words(['Pittsburgh']),
            'portland': HNJobPosting.matching_words(['Portland']),
            'prague': HNJobPosting.matching_words(['Prague']),
            'princeton': HNJobPosting.matching_words(['Princeton']),
            'pune': HNJobPosting.matching_words(['Pune']),
            'raleigh': HNJobPosting.matching_words(['Raleigh']),
            'redwood-city': HNJobPosting.matching_words(['Redwood City']),
            'salt-lake-city': HNJobPosting.matching_words(['Salt Lake City']),
            'san-antonio': HNJobPosting.matching_words(['San Antonio']),
            'san-diego': HNJobPosting.matching_words(['San Diego']),
            'san-francisco': HNJobPosting.matching_words(['San Francisco', 'S.F.', 'SF']),
            'san-jose': HNJobPosting.matching_words(['San Jose']),
            'san-mateo': HNJobPosting.matching_words(['San Mateo']),
            'sao-paulo': HNJobPosting.matching_words(['Sao Paulo', 'São Paulo']),
            'seattle': HNJobPosting.matching_words(['Seattle']),
            'seoul': HNJobPosting.matching_words(['Seoul']),
            'shanghai': HNJobPosting.matching_words(['Shanghai']),
            'singapore': HNJobPosting.matching_words(['Singapore']),
            'st-louis': HNJobPosting.matching_words(['St. Louis']),
            'stockholm': HNJobPosting.matching_words(['Stockholm']),
            'sunnnyvale' : HNJobPosting.matching_words(['Sunnyvale']),
            'sydney': HNJobPosting.matching_words(['Sydney']),
            'tel-aviv': HNJobPosting.matching_words(['Tel Aviv']),
            'tokyo': HNJobPosting.matching_words(['Tokyo']),
            'toronto': HNJobPosting.matching_words(['Toronto']),
            'vienna': HNJobPosting.matching_words(['Vienna']),
            'waterloo': HNJobPosting.matching_words(['Waterloo']),
            'wellington': HNJobPosting.matching_words(['Wellington']),
            'zurich': HNJobPosting.matching_words(['Zurich'])
        },
        'role' :{
            'backend-engineer': HNJobPosting.matching_words(['backend', 'back-end', 'back end']),
            'frontend-engineer': HNJobPosting.matching_words(['frontend', 'front-end', 'front end']),
            'fullstack-engineer': HNJobPosting.matching_words(['fullstack', 'full-stack', 'full stack']),
            'devops-engineer': HNJobPosting.matching_words(['devops', 'dev-ops', 'dev ops', 'dev-ops', 'dev ops']),
            'data-scientist' : HNJobPosting.matching_words(['data science', 'data scientist', 'data science', 'data-scientist']),
            'data-engineer' : HNJobPosting.matching_words(['data engineer', 'data engineering']),
            'machine-learning-engineer' : HNJobPosting.matching_words(['machine learning','machine learning engineer', 'machine learning engineering']),
            'product-manager' : HNJobPosting.matching_words(['product manager', 'product management']),
            'project-manager' : HNJobPosting.matching_words(['project manager', 'project management']),
            'ux-designer' : HNJobPosting.matching_words(['ux designer', 'ux design']),
            'ui-designer' : HNJobPosting.matching_words(['ui designer', 'ui design']),
            'qa-engineer' : HNJobPosting.matching_words(['qa engineer', 'qa engineering']),
        },
        'job-type' : {
            'full-time': HNJobPosting.matching_words(['full-time', 'full time']),
            'part-time': HNJobPosting.matching_words(['part-time', 'part time']),
            'contract': HNJobPosting.matching_words(['contract']),
            'internship': HNJobPosting.matching_words(['internship']),
        }
    }
    # fmt: on

    # register all tags
    for kind, finder in finders.items():
        for slug, query in finder.items():
            tag_name = f"{kind}:{slug}"
            Tag.objects.get_or_create(name=tag_name)

    for kind, finder in finders.items():
        existing_tags = HNJobPosting.tags.filter(
            name__startswith=f"{kind}:"
        ).values_list("name", flat=True)
        # existing_slugs = [tag.split(':')[1] for tag in existing_tags]

        for slug, query in finder.items():
            tag_name = f"{kind}:{slug}"
            print(tag_name)
            for posting in HNJobPosting.objects.filter(query):
                posting.tags.add(tag_name)

            # postings_with_tag = HNJobPosting.objects.filter(tags__name=tag_name)
            # for posting in HNJobPosting.objects.exclude(
            #     id__in=postings_with_tag.values_list("id", flat=True)
            # ):
            #     posting.tags.remove(tag_name)

        for tag_name in existing_tags:
            if tag_name.split(":")[1] not in finder.keys():
                for posting in HNJobPosting.objects.filter(tags__name=tag_name):
                    posting.tags.remove(tag_name)
