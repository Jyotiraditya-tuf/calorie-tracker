import os
import logging
from typing import Optional, Dict, Any, List

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, status, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from models import FoodAnalysisResult
from gemini_service import analyze_food_multimodal
from database import (
    init_db, 
    generate_unique_sync_id, 
    get_sync_data, 
    save_or_merge_sync_data,
    record_rl_feedback,
    get_all_rl_feedback,
    delete_rl_feedback
)

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("calorie-tracker-backend")

# Initialize database schema on load
try:
    init_db()
    logger.info("Persistent SQLite database initialized successfully.")
except Exception as e:
    logger.error(f"Failed to initialize database: {e}")

app = FastAPI(
    title="AI Calorie & Nutrition Tracker API",
    description="Backend API powered by Google GenAI (Gemini) for multimodal food decomposition, nutrition coaching, cloud synchronization, and Reinforcement Learning from Human Feedback (RLHF).",
    version="1.2.0"
)

# Enable CORS for frontend development and production hosting
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "app": "AI Calorie & Nutrition Tracker",
        "docs": "/docs",
        "status": "online",
        "database": "sqlite_ready",
        "features": ["multimodal_analysis", "cloud_sync", "reinforcement_learning"]
    }


@app.get("/health")
def health_check():
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    is_gemini_active = bool(api_key and api_key != "your_gemini_api_key_here")
    return {
        "status": "healthy",
        "gemini_configured": is_gemini_active,
        "database_ready": True,
        "rl_active": True,
        "model": os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    }


@app.post("/api/analyze", response_model=FoodAnalysisResult)
async def analyze_food(
    image: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None)
):
    """
    Multimodal food recognition endpoint.
    Accepts an optional food photo and/or an optional descriptive text prompt.
    Returns structured plate decomposition, nutrition totals, clarification chips, and a coach tip,
    augmented with active Reinforcement Learning rules learned from past user corrections.
    """
    has_image = image is not None and image.filename != ""
    has_text = text is not None and text.strip() != ""

    if not has_image and not has_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide at least a meal photo or a text description to analyze."
        )

    image_bytes = None
    mime_type = None

    if has_image:
        try:
            image_bytes = await image.read()
            mime_type = image.content_type or "image/jpeg"
            logger.info(f"Received image: {image.filename} ({len(image_bytes)} bytes, MIME: {mime_type})")
        except Exception as e:
            logger.error(f"Failed to read uploaded image: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to process uploaded image file: {str(e)}"
            )

    if has_text:
        logger.info(f"Received user text context: {text.strip()}")

    try:
        result = analyze_food_multimodal(
            image_bytes=image_bytes,
            mime_type=mime_type,
            text_prompt=text.strip() if text else None
        )
        return result
    except Exception as e:
        logger.error(f"Analysis failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Food analysis pipeline error: {str(e)}"
        )


# ==========================================
# Reinforcement Learning & Feedback Endpoints
# ==========================================

@app.post("/api/feedback")
def submit_human_feedback(payload: Dict[str, Any] = Body(...)):
    """
    Record human feedback / ground-truth correction on a predicted dish name.
    Expects { "original_name": str, "corrected_name": str, "details": optional dict }.
    This updates the AI's in-context reinforcement memory for future analyses.
    """
    original_name = payload.get("original_name", "").strip()
    corrected_name = payload.get("corrected_name", "").strip()
    details = payload.get("details", {})

    if not original_name or not corrected_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both 'original_name' and 'corrected_name' are required."
        )

    if original_name.lower() == corrected_name.lower():
        return {"status": "unchanged", "message": "No name change detected."}

    try:
        result = record_rl_feedback(original_name, corrected_name, details)
        logger.info(f"RL Feedback recorded: '{original_name}' -> '{corrected_name}' (weight: {result.get('reinforcement_weight')})")
        return result
    except Exception as e:
        logger.error(f"Failed to record RL feedback: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving feedback: {str(e)}"
        )


@app.get("/api/feedback")
def list_learned_feedback(limit: int = 20):
    """List learned human corrections and their reinforcement weights."""
    return get_all_rl_feedback(limit=limit)


@app.delete("/api/feedback/{feedback_id}")
def remove_feedback(feedback_id: int):
    """Delete a learned feedback rule."""
    success = delete_rl_feedback(feedback_id)
    if not success:
        raise HTTPException(status_code=404, detail="Feedback rule not found.")
    return {"status": "deleted", "feedback_id": feedback_id}


# ==========================================
# Cloud Synchronization Endpoints
# ==========================================

@app.post("/api/sync/generate-id")
def generate_sync_id():
    """Generates a memorable 6-character sync code for cross-device linking."""
    code = generate_unique_sync_id()
    return {"sync_id": code}


@app.get("/api/sync/{sync_id}")
def get_user_cloud_data(sync_id: str):
    """Fetch all stored logs and macro goals for a specific sync ID."""
    clean_id = sync_id.strip().upper()
    data = get_sync_data(clean_id)
    if not data:
        return {
            "sync_id": clean_id,
            "logs": {},
            "goals": {},
            "is_new": True,
            "message": "No existing cloud records found. Ready to sync first entry."
        }
    return data


@app.post("/api/sync/{sync_id}")
def sync_user_cloud_data(
    sync_id: str,
    payload: Dict[str, Any] = Body(...)
):
    """
    Two-way synchronization endpoint.
    Accepts client daily logs and macro targets, merges with cloud data, and returns unified state.
    """
    clean_id = sync_id.strip().upper()
    logs = payload.get("logs", {})
    goals = payload.get("goals", {})
    
    try:
        updated = save_or_merge_sync_data(clean_id, logs, goals)
        logger.info(f"Successfully synced data for ID: {clean_id}")
        return updated
    except Exception as e:
        logger.error(f"Sync failed for ID {clean_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Cloud synchronization error: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
