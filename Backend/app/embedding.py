from functools import lru_cache

from sentence_transformers import SentenceTransformer

from app.config import get_settings


@lru_cache
def get_embedding_model() -> SentenceTransformer:
    return SentenceTransformer(get_settings().embedding_model)


def encode(text: str) -> list[float]:
    vector = get_embedding_model().encode(text, normalize_embeddings=True)
    return vector.tolist()
