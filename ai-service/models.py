from pydantic import BaseModel
from typing import Optional, List

class AnalysisRequest(BaseModel):
    username: str
    target_role: Optional[str] = "Full Stack Engineer"
    analysis_id: str

class RepoData(BaseModel):
    name: str
    description: Optional[str]
    language: Optional[str]
    stars: int
    forks: int
    updated_at: str
    readme: Optional[str]
    topics: List[str]

class ScoreBreakdown(BaseModel):
    activity: int
    depth: int
    breadth: int
    communication: int
    impact: int
    overall: int

class AnalysisReport(BaseModel):
    username: str
    score: ScoreBreakdown
    summary: str
    strengths: List[str]
    weaknesses: List[str]
    skill_gaps: List[str]
    matched_skills: List[str]
    repo_suggestions: List[str]
    top_repos: List[str]