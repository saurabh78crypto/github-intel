import json
import logging
import os
from huggingface_hub import AsyncInferenceClient
from rag import query_collection
from typing import List

logger = logging.getLogger(__name__)

_client: AsyncInferenceClient | None = None

MODEL = "Qwen/Qwen2.5-7B-Instruct"

def get_client() -> AsyncInferenceClient:
    global _client
    if _client is None:
        api_key = os.getenv("HF_TOKEN", "").strip()
        if not api_key:
            logger.critical("HF_TOKEN is not set — cannot create inference client.")
            raise ValueError(
                "HF_TOKEN is not set. Add it to your .env file in the ai-service directory."
            )
        logger.info("Initialising AsyncInferenceClient (provider=auto, model=%s).", MODEL)
        _client = AsyncInferenceClient(provider="auto", api_key=api_key)
    return _client

SCORE_PROMPT = """
You are a senior technical recruiter analyzing a GitHub profile.
Based on the repository data below, score this developer profile from 0-100 across 5 dimensions.

Repos data:
{repos_context}

Profile metadata:
{profile_meta}

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
{{
  "activity": <0-100>,
  "depth": <0-100>,
  "breadth": <0-100>,
  "communication": <0-100>,
  "impact": <0-100>,
  "overall": <0-100>,
  "reasoning": {{
    "activity": "one sentence",
    "depth": "one sentence",
    "breadth": "one sentence",
    "communication": "one sentence",
    "impact": "one sentence"
  }}
}}

Scoring criteria:
- activity: commit recency, number of repos, update frequency
- depth: project complexity, tech stack sophistication
- breadth: language diversity, varied domains
- communication: README quality, descriptions, topics
- impact: stars, forks, real-world usefulness
"""

REPORT_PROMPT = """
You are a senior technical recruiter analyzing a GitHub profile for a candidate targeting the role: {target_role}.

Profile:
{profile_meta}

Most relevant repositories:
{repos_context}

Return ONLY valid JSON (no markdown, no preamble) in this exact format:
{{
  "summary": "2-3 sentence overall summary of this developer",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "skill_gaps": ["skill missing for {target_role} 1", "skill missing 2", "skill missing 3"],
  "matched_skills": ["skill that matches {target_role} 1", "skill 2", "skill 3"],
  "repo_suggestions": [
    "Specific actionable suggestion for repo X",
    "Specific actionable suggestion for repo Y"
  ],
  "top_repos": ["repo_name_1", "repo_name_2", "repo_name_3"]
}}
"""

def safe_json_parse(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:-1])
    return json.loads(text)

async def generate_scores(
    analysis_id: str,
    profile: dict,
    repos: List[dict],
) -> dict:
    logger.info("generate_scores START — analysis_id=%s", analysis_id)

    repos_context = query_collection(
        analysis_id, "technical skills projects complexity", n_results=10
    )
    context_text = "\n\n---\n\n".join(repos_context) if repos_context else "No repos found"

    profile_meta = (
        f"Username: {profile['username']}\n"
        f"Public repos: {profile['public_repos']}\n"
        f"Followers: {profile['followers']}\n"
        f"Bio: {profile['bio']}\n"
        f"Account created: {profile['created_at']}"
    )

    try:
        response = await get_client().chat.completions.create(
            model=MODEL,
            messages=[{
                "role": "user",
                "content": SCORE_PROMPT.format(
                    repos_context=context_text,
                    profile_meta=profile_meta,
                ),
            }],
            max_tokens=1000,
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
        result = safe_json_parse(raw)
        logger.info(
            "generate_scores DONE — analysis_id=%s overall=%s",
            analysis_id, result.get("overall"),
        )
        return result
    except json.JSONDecodeError as exc:
        logger.error(
            "generate_scores JSON parse error — analysis_id=%s: %s", analysis_id, exc
        )
        raise
    except Exception as exc:
        logger.error(
            "generate_scores FAILED — analysis_id=%s: %s", analysis_id, exc, exc_info=True
        )
        raise

async def generate_report(
    analysis_id: str,
    profile: dict,
    repos: List[dict],
    target_role: str,
) -> dict:
    logger.info(
        "generate_report START — analysis_id=%s target_role=%s", analysis_id, target_role
    )

    repos_context = query_collection(
        analysis_id,
        f"projects skills experience relevant to {target_role}",
        n_results=8,
    )
    context_text = "\n\n---\n\n".join(repos_context) if repos_context else "No repos found"

    profile_meta = (
        f"Username: {profile['username']}\n"
        f"Name: {profile['name']}\n"
        f"Bio: {profile['bio']}\n"
        f"Public repos: {profile['public_repos']}"
    )

    try:
        response = await get_client().chat.completions.create(
            model=MODEL,
            messages=[{
                "role": "user",
                "content": REPORT_PROMPT.format(
                    target_role=target_role,
                    profile_meta=profile_meta,
                    repos_context=context_text,
                ),
            }],
            max_tokens=1500,
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content
        result = safe_json_parse(raw)
        logger.info("generate_report DONE — analysis_id=%s", analysis_id)
        return result
    except json.JSONDecodeError as exc:
        logger.error(
            "generate_report JSON parse error — analysis_id=%s: %s", analysis_id, exc
        )
        raise
    except Exception as exc:
        logger.error(
            "generate_report FAILED — analysis_id=%s: %s", analysis_id, exc, exc_info=True
        )
        raise