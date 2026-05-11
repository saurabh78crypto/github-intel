import logging
import logging.config
import json
import uuid

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from models import AnalysisRequest, AnalysisReport, ScoreBreakdown
from scraper import scrape_profile
from embedder import warmup_model
from rag import build_collection, cleanup_collection
from analyzer import generate_scores, generate_report

logging.config.dictConfig({
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s [%(levelname)s] %(name)s — %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "standard",
        }
    },
    "root": {"handlers": ["console"], "level": "INFO"},
})

logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="GitHub Intel AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Pre-load the embedding model once so every analysis request is fast."""
    logger.info("=== AI Service starting up ===")
    try:
        warmup_model()
        logger.info("Startup complete — ready to accept requests.")
    except Exception as exc:
        logger.critical("Startup failed during model warm-up: %s", exc, exc_info=True)

async def send_progress(ws: WebSocket, stage: str, message: str, percent: int):
    payload = {"stage": stage, "message": message, "percent": percent}
    logger.info("[%s] %d%% — %s", stage.upper(), percent, message)
    await ws.send_text(json.dumps(payload))

@app.websocket("/analyze")
async def analyze_websocket(websocket: WebSocket):
    await websocket.accept()
    analysis_id = str(uuid.uuid4())
    username = "<unknown>"

    logger.info("New WebSocket connection — analysis_id=%s", analysis_id)

    try:
        data = await websocket.receive_text()
        payload = json.loads(data)
        username = payload.get("username", "").strip()
        target_role = payload.get("target_role", "Full Stack Engineer")

        logger.info(
            "Analysis requested — analysis_id=%s username=%s role=%s",
            analysis_id, username, target_role,
        )

        if not username:
            logger.warning("analysis_id=%s — username missing, aborting.", analysis_id)
            await websocket.send_text(json.dumps({"error": "Username is required"}))
            return

        # Scraping
        await send_progress(websocket, "scraping", f"Fetching GitHub profile for @{username}…", 10)
        try:
            scraped = await scrape_profile(username)
        except ValueError as exc:
            logger.error(
                "analysis_id=%s Scraping failed for %s: %s", analysis_id, username, exc
            )
            await websocket.send_text(json.dumps({"error": str(exc)}))
            return

        profile = scraped["profile"]
        repos = scraped["repos"]
        logger.info(
            "analysis_id=%s Scraping OK — %d repos found for %s",
            analysis_id, len(repos), username,
        )
        await send_progress(websocket, "scraping", f"Found {len(repos)} repositories.", 25)

        # Embedding
        await send_progress(websocket, "embedding", "Building semantic index of repositories…", 40)
        try:
            collection = build_collection(analysis_id, repos)
            logger.info("analysis_id=%s Embedding OK — collection built.", analysis_id)
        except Exception as exc:
            logger.error(
                "analysis_id=%s Embedding FAILED: %s", analysis_id, exc, exc_info=True
            )
            await websocket.send_text(json.dumps({"error": "Failed to index repositories."}))
            return
        await send_progress(websocket, "embedding", "Repository index built.", 55)

        # Scoring
        await send_progress(websocket, "scoring", "Calculating recruiter signal scores…", 65)
        try:
            scores_raw = await generate_scores(analysis_id, profile, repos)
            logger.info(
                "analysis_id=%s Scoring OK — overall=%s",
                analysis_id, scores_raw.get("overall"),
            )
        except Exception as exc:
            logger.error(
                "analysis_id=%s Scoring FAILED: %s", analysis_id, exc, exc_info=True
            )
            await websocket.send_text(json.dumps({"error": "Failed to score repositories."}))
            return

        score = ScoreBreakdown(
            activity=scores_raw.get("activity", 50),
            depth=scores_raw.get("depth", 50),
            breadth=scores_raw.get("breadth", 50),
            communication=scores_raw.get("communication", 50),
            impact=scores_raw.get("impact", 50),
            overall=scores_raw.get("overall", 50),
        )
        await send_progress(websocket, "scoring", "Scores calculated.", 75)

        # Report generation
        await send_progress(websocket, "report", "Generating full intelligence report…", 85)
        try:
            report_data = await generate_report(analysis_id, profile, repos, target_role)
            logger.info("analysis_id=%s Report OK.", analysis_id)
        except Exception as exc:
            logger.error(
                "analysis_id=%s Report generation FAILED: %s", analysis_id, exc, exc_info=True
            )
            await websocket.send_text(json.dumps({"error": "Failed to generate report."}))
            return

        await send_progress(websocket, "complete", "Analysis complete!", 100)

        final_report = {
            "analysis_id": analysis_id,
            "username": username,
            "profile": profile,
            "score": score.dict(),
            "score_reasoning": scores_raw.get("reasoning", {}),
            "summary": report_data.get("summary", ""),
            "strengths": report_data.get("strengths", []),
            "weaknesses": report_data.get("weaknesses", []),
            "skill_gaps": report_data.get("skill_gaps", []),
            "matched_skills": report_data.get("matched_skills", []),
            "repo_suggestions": report_data.get("repo_suggestions", []),
            "top_repos": report_data.get("top_repos", []),
            "target_role": target_role,
            "total_repos_analyzed": len(repos),
        }

        logger.info(
            "analysis_id=%s Sending final report to client (username=%s, overall=%d).",
            analysis_id, username, score.overall,
        )
        await websocket.send_text(json.dumps({"result": final_report}))

    except WebSocketDisconnect:
        logger.warning(
            "analysis_id=%s Client disconnected mid-analysis (username=%s).",
            analysis_id, username,
        )
    except Exception as exc:
        logger.error(
            "analysis_id=%s Unhandled error (username=%s): %s",
            analysis_id, username, exc, exc_info=True,
        )
        try:
            await websocket.send_text(
                json.dumps({"error": f"Analysis failed unexpectedly."})
            )
        except Exception:
            pass
    finally:
        cleanup_collection(analysis_id)
        logger.info("analysis_id=%s Cleanup done.", analysis_id)


@app.get("/health")
def health():
    logger.debug("Health check called.")
    return {"status": "ok"}