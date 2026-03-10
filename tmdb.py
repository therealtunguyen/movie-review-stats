import os

import httpx

TMDB_BASE_URL = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w200"
MAX_REVIEW_PAGES = 5


def _get_auth_headers() -> dict:
    token = os.environ.get("TMDB_API_KEY")
    if not token:
        raise ValueError("TMDB_API_KEY environment variable is not set")
    return {"Authorization": f"Bearer {token}", "accept": "application/json"}


async def search_movies(query: str) -> list[dict]:
    headers = _get_auth_headers()
    async with httpx.AsyncClient(timeout=10, headers=headers) as client:
        response = await client.get(
            f"{TMDB_BASE_URL}/search/movie",
            params={"query": query, "language": "en-US", "page": 1},
        )
        response.raise_for_status()
        data = response.json()

    results = []
    for movie in data.get("results", []):
        release_date = movie.get("release_date") or ""
        release_year = int(release_date[:4]) if len(release_date) >= 4 else None
        poster_path = movie.get("poster_path")
        poster_url = f"{TMDB_IMAGE_BASE}{poster_path}" if poster_path else None
        results.append(
            {
                "id": movie["id"],
                "title": movie["title"],
                "release_year": release_year,
                "poster_url": poster_url,
                "tmdb_rating": movie.get("vote_average"),
            }
        )
    return results


async def fetch_reviews(movie_id: int) -> tuple[str, list[dict]]:
    headers = _get_auth_headers()
    async with httpx.AsyncClient(timeout=10, headers=headers) as client:
        movie_resp = await client.get(f"{TMDB_BASE_URL}/movie/{movie_id}")
        movie_resp.raise_for_status()
        title = movie_resp.json().get("title", "")

        reviews: list[dict] = []
        for page in range(1, MAX_REVIEW_PAGES + 1):
            rev_resp = await client.get(
                f"{TMDB_BASE_URL}/movie/{movie_id}/reviews",
                params={"page": page},
            )
            rev_resp.raise_for_status()
            rev_data = rev_resp.json()
            page_results = rev_data.get("results", [])
            for r in page_results:
                author_details = r.get("author_details") or {}
                reviews.append(
                    {
                        "id": r["id"],
                        "author": r.get("author", ""),
                        "content": r.get("content", ""),
                        "author_rating": author_details.get("rating"),
                        "created_at": r.get("created_at", ""),
                    }
                )
            if len(page_results) == 0 or rev_data.get("page", 1) >= rev_data.get(
                "total_pages", 1
            ):
                break

    return title, reviews
