import sqlite3
import json
import os
import random
import string
from datetime import datetime
from typing import Optional, Dict, Any, List, Tuple

DB_PATH = os.path.join(os.path.dirname(__file__), "calorie_tracker.db")


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize the SQLite database schema if not already present."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        # User sync table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sync (
                sync_id TEXT PRIMARY KEY,
                logs_json TEXT NOT NULL,
                goals_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Reinforcement Learning from Human Feedback (RLHF) memory table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS rl_feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                original_name TEXT NOT NULL,
                corrected_name TEXT NOT NULL,
                occurrence_count INTEGER DEFAULT 1,
                details_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(original_name, corrected_name)
            )
        """)
        conn.commit()


def generate_unique_sync_id() -> str:
    """Generate a readable, unique 6-character alphanumeric sync code like NUTRI-8924."""
    numbers = "".join(random.choices(string.digits, k=4))
    letters = "".join(random.choices(string.ascii_uppercase, k=2))
    candidate = f"NUTRI-{letters}{numbers}"
    
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT sync_id FROM user_sync WHERE sync_id = ?", (candidate,))
        if cursor.fetchone():
            return generate_unique_sync_id()
    return candidate


def get_sync_data(sync_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve daily logs and macro goals for a given sync ID."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT sync_id, logs_json, goals_json, updated_at FROM user_sync WHERE sync_id = ?",
            (sync_id.strip().upper(),)
        )
        row = cursor.fetchone()
        if not row:
            return None
        
        try:
            logs = json.loads(row["logs_json"])
        except Exception:
            logs = {}
            
        try:
            goals = json.loads(row["goals_json"])
        except Exception:
            goals = {}

        return {
            "sync_id": row["sync_id"],
            "logs": logs,
            "goals": goals,
            "updated_at": row["updated_at"]
        }


def save_or_merge_sync_data(sync_id: str, logs: Dict[str, Any], goals: Dict[str, Any]) -> Dict[str, Any]:
    """Save or merge logs and goals for a sync ID."""
    clean_id = sync_id.strip().upper()
    existing = get_sync_data(clean_id)
    
    merged_logs = {}
    if existing and isinstance(existing.get("logs"), dict):
        merged_logs.update(existing["logs"])
        
    # Merge client logs into existing
    if isinstance(logs, dict):
        for date_str, client_meals in logs.items():
            if date_str not in merged_logs:
                merged_logs[date_str] = client_meals
            else:
                # Merge meals by ID
                existing_meal_map = {m["id"]: m for m in merged_logs[date_str] if "id" in m}
                for m in client_meals:
                    m_id = m.get("id")
                    if m_id:
                        existing_meal_map[m_id] = m
                    else:
                        merged_logs[date_str].append(m)
                merged_logs[date_str] = list(existing_meal_map.values())
    else:
        merged_logs = logs

    merged_goals = goals if goals else (existing.get("goals") if existing else {})

    logs_str = json.dumps(merged_logs)
    goals_str = json.dumps(merged_goals)
    now_str = datetime.utcnow().isoformat()

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO user_sync (sync_id, logs_json, goals_json, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(sync_id) DO UPDATE SET
                logs_json = excluded.logs_json,
                goals_json = excluded.goals_json,
                updated_at = excluded.updated_at
        """, (clean_id, logs_str, goals_str, now_str))
        conn.commit()

    return {
        "sync_id": clean_id,
        "logs": merged_logs,
        "goals": merged_goals,
        "updated_at": now_str
    }


# ========================================================
# Reinforcement Learning from Human Feedback (RLHF) Engine
# ========================================================

def record_rl_feedback(original_name: str, corrected_name: str, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Record explicit human correction feedback.
    When a user alters Gemini's suggested dish name, this provides positive reward
    for the corrected name and negative reinforcement for the original misclassification.
    """
    orig_clean = original_name.strip()
    corr_clean = corrected_name.strip()

    if not orig_clean or not corr_clean or orig_clean.lower() == corr_clean.lower():
        return {"status": "ignored", "reason": "Names are identical or empty"}

    details_json = json.dumps(details or {})
    now_str = datetime.utcnow().isoformat()

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO rl_feedback (original_name, corrected_name, occurrence_count, details_json, created_at, updated_at)
            VALUES (?, ?, 1, ?, ?, ?)
            ON CONFLICT(original_name, corrected_name) DO UPDATE SET
                occurrence_count = rl_feedback.occurrence_count + 1,
                details_json = excluded.details_json,
                updated_at = excluded.updated_at
        """, (orig_clean, corr_clean, details_json, now_str, now_str))
        conn.commit()

        cursor.execute("""
            SELECT id, original_name, corrected_name, occurrence_count, updated_at
            FROM rl_feedback
            WHERE original_name = ? AND corrected_name = ?
        """, (orig_clean, corr_clean))
        row = cursor.fetchone()

        return {
            "status": "success",
            "feedback_id": row["id"],
            "original_name": row["original_name"],
            "corrected_name": row["corrected_name"],
            "reinforcement_weight": row["occurrence_count"],
            "updated_at": row["updated_at"]
        }


def get_all_rl_feedback(limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieve all learned human feedback pairs sorted by weight/occurrences."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, original_name, corrected_name, occurrence_count, details_json, updated_at
            FROM rl_feedback
            ORDER BY occurrence_count DESC, updated_at DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()

        results = []
        for r in rows:
            try:
                details = json.loads(r["details_json"]) if r["details_json"] else {}
            except Exception:
                details = {}
            results.append({
                "id": r["id"],
                "original_name": r["original_name"],
                "corrected_name": r["corrected_name"],
                "occurrences": r["occurrence_count"],
                "details": details,
                "updated_at": r["updated_at"]
            })
        return results


def delete_rl_feedback(feedback_id: int) -> bool:
    """Delete a specific feedback rule."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM rl_feedback WHERE id = ?", (feedback_id,))
        conn.commit()
        return cursor.rowcount > 0


def format_rl_prompt_instructions() -> str:
    """
    Format stored human corrections into in-context Reinforcement Learning rules
    that are injected into the Gemini model prompt.
    """
    rules = get_all_rl_feedback(limit=10)
    if not rules:
        return ""

    rule_lines = []
    for r in rules:
        rule_lines.append(
            f"- When a plate or meal visually resembles or could be classified as '{r['original_name']}', "
            f"strongly prefer the user's verified ground-truth correction: '{r['corrected_name']}' "
            f"(Reinforced by user feedback {r['occurrences']}x)."
        )

    return (
        "\n\n--- REINFORCEMENT LEARNING FROM HUMAN FEEDBACK (ACTIVE USER PREFERENCES) ---\n"
        "The user has previously corrected your meal predictions. Apply these verified corrections with high priority:\n"
        + "\n".join(rule_lines)
    )
