import httpx
from openai.embeddings_utils import get_embedding
from functools import partial

get_embedding = partial(get_embedding, engine='text-embedding-ada-002')

def fetch(url):
    response = httpx.get(url)
    response.raise_for_status()
    return response.json()



