import logging
from dotenv import load_dotenv
import httpx
import os
import asyncio
from models import RepoData
from typing import List, Optional

load_dotenv()

logger = logging.getLogger(__name__)

GITHUB_API = "https://api.github.com"

BASE_HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}

README_CONCURRENCY = 5
README_LIMIT = 20

semaphore = asyncio.Semaphore(README_CONCURRENCY)

def get_headers(with_auth: bool = True) -> dict:
    headers = BASE_HEADERS.copy()
    token = os.getenv("GITHUB_TOKEN", "").strip()
    if with_auth and token:
        headers["Authorization"] = f"Bearer {token}"
    return headers

async def _get(
    client: httpx.AsyncClient,
    url: str,
    params: dict = None,
) -> httpx.Response:
    response = await client.get(url, headers=get_headers(with_auth=True), params=params)
    if response.status_code == 401:
        logger.warning("GitHub token invalid/expired — retrying without auth. url=%s", url)
        response = await client.get(url, headers=get_headers(with_auth=False), params=params)
    return response

async def fetch_user_profile(client: httpx.AsyncClient, username: str) -> dict:
    logger.info("Fetching GitHub profile for username=%s", username)
    response = await _get(client, f"{GITHUB_API}/users/{username}")

    if response.status_code == 404:
        logger.warning("GitHub user not found: %s", username)
        raise ValueError(f"GitHub user '{username}' not found.")

    if response.status_code == 403:
        logger.error("GitHub API rate limit exceeded while fetching profile for %s", username)
        raise ValueError("GitHub API rate limit exceeded. Please try again later.")

    response.raise_for_status()
    data = response.json()
    logger.info(
        "Profile fetched OK — username=%s public_repos=%d followers=%d",
        data.get("login"), data.get("public_repos", 0), data.get("followers", 0),
    )
    return data

async def fetch_repos(
    client: httpx.AsyncClient,
    username: str,
    max_repos: int = 50,
) -> List[dict]:
    logger.info("Fetching repos for username=%s (max=%d)", username, max_repos)
    response = await _get(
        client,
        f"{GITHUB_API}/users/{username}/repos",
        params={"sort": "updated", "per_page": max_repos, "type": "owner"},
    )

    if response.status_code == 403:
        logger.error("GitHub API rate limit exceeded while fetching repos for %s", username)
        raise ValueError("GitHub API rate limit exceeded. Please try again later.")

    response.raise_for_status()
    repos = response.json()
    logger.info("Fetched %d repos for username=%s", len(repos), username)
    return repos

async def fetch_readme(
    client: httpx.AsyncClient,
    username: str,
    repo_name: str,
) -> Optional[str]:
    async with semaphore:
        try:
            headers = get_headers(with_auth=True)
            headers["Accept"] = "application/vnd.github.raw"

            response = await client.get(
                f"{GITHUB_API}/repos/{username}/{repo_name}/readme",
                headers=headers,
                follow_redirects=True,
            )

            if response.status_code == 401:
                logger.debug("Token invalid for README %s/%s — retrying unauthenticated.", username, repo_name)
                headers = get_headers(with_auth=False)
                headers["Accept"] = "application/vnd.github.raw"
                response = await client.get(
                    f"{GITHUB_API}/repos/{username}/{repo_name}/readme",
                    headers=headers,
                    follow_redirects=True,
                )

            if response.status_code == 200:
                text = response.text.strip()[:1500]
                logger.debug("README fetched for %s/%s (%d chars).", username, repo_name, len(text))
                return text

            logger.debug(
                "No README for %s/%s — HTTP %d.", username, repo_name, response.status_code
            )
            return None

        except Exception as exc:
            logger.warning("README fetch error for %s/%s: %s", username, repo_name, exc)
            return None

async def scrape_profile(username: str) -> dict:
    """Main scraper entry point — fetches profile, repos, and READMEs."""
    logger.info("scrape_profile START — username=%s", username)

    timeout = httpx.Timeout(20.0)
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:

        profile = await fetch_user_profile(client, username)

        if profile.get("public_repos", 0) == 0:
            logger.warning("username=%s has no public repositories.", username)
            raise ValueError(f"'{username}' has no public repositories to analyse.")

        raw_repos = await fetch_repos(client, username)

        if not raw_repos:
            logger.warning("username=%s — repo list came back empty.", username)
            raise ValueError(f"No public repositories found for '{username}'.")

        top_repos = raw_repos[:README_LIMIT]
        logger.info("Fetching READMEs for %d repos (username=%s)…", len(top_repos), username)

        readme_tasks = [
            fetch_readme(client, username, repo["name"])
            for repo in top_repos
        ]
        readmes = await asyncio.gather(*readme_tasks)

        repos: List[RepoData] = []
        readme_found = 0
        for repo, readme in zip(top_repos, readmes):
            if readme:
                readme_found += 1
            repos.append(
                RepoData(
                    name=repo["name"],
                    description=repo.get("description") or "",
                    language=repo.get("language") or "Unknown",
                    stars=repo.get("stargazers_count", 0),
                    forks=repo.get("forks_count", 0),
                    updated_at=repo.get("updated_at", ""),
                    readme=readme or "",
                    topics=repo.get("topics", []),
                )
            )

        logger.info(
            "scrape_profile DONE — username=%s repos=%d readmes=%d",
            username, len(repos), readme_found,
        )

        return {
            "profile": {
                "username": profile["login"],
                "name": profile.get("name") or profile["login"],
                "bio": profile.get("bio") or "",
                "public_repos": profile.get("public_repos", 0),
                "followers": profile.get("followers", 0),
                "created_at": profile.get("created_at", ""),
            },
            "repos": [repo.dict() for repo in repos],
            "total_repos_fetched": len(repos),
        }