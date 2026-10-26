import sqlite3
import json
import os
import random
import string
from datetime import datetime
from typing import Optional, Dict, Any, Tuple

DB_PATH = os.path.join(os.path.dirname(__file__), "calorie_tracker.db")


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize the SQLite database schema if not already present."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_sync (
                sync_id TEXT PRIMARY KEY,
                logs_json TEXT NOT NULL,
                goals_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
