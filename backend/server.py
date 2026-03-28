from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'progress_tracker')]

EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# ---- Models ----

class DailyLogCreate(BaseModel):
    date: str
    mood: Optional[str] = None
    entries: Dict[str, Any] = {}

class ReviewRequest(BaseModel):
    date: str

class CustomActivityCreate(BaseModel):
    name: str
    icon: str = "star-outline"
    color: str = "#888888"

class SettingUpdate(BaseModel):
    value: str


# ---- Server-side Activity Reference ----

DEFAULT_ACTIVITIES = [
    {"id": "work", "name": "Work"},
    {"id": "gym", "name": "Gym"},
    {"id": "chess", "name": "Chess"},
    {"id": "guitar", "name": "Guitar"},
    {"id": "tv", "name": "TV/Movies"},
    {"id": "reading", "name": "Reading"},
    {"id": "journal", "name": "Journalling"},
    {"id": "shopping", "name": "Shopping"},
    {"id": "startup", "name": "Startup"},
    {"id": "articles", "name": "Articles"},
    {"id": "ai", "name": "AI Knowledge"},
    {"id": "jobprep", "name": "Job Prep"},
    {"id": "family", "name": "Family Time"},
    {"id": "rest", "name": "Rest"},
]

DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


def calc_minutes(start: str, end: str) -> int:
    try:
        sh, sm = map(int, start.split(":"))
        eh, em = map(int, end.split(":"))
        return (eh * 60 + em) - (sh * 60 + sm)
    except Exception:
        return 0


def get_week_dates(date_str: str) -> list:
    d = datetime.strptime(date_str, "%Y-%m-%d")
    monday = d - timedelta(days=d.weekday())
    return [(monday + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(7)]


# ---- Endpoints ----

@api_router.get("/")
async def root():
    return {"message": "Daily Progress Tracker API"}


@api_router.get("/logs/{date}")
async def get_log(date: str):
    log = await db.daily_logs.find_one({"date": date}, {"_id": 0})
    if not log:
        return {"date": date, "mood": None, "entries": {}}
    return log


@api_router.post("/logs")
async def save_log(log_data: DailyLogCreate):
    doc = log_data.dict()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    existing = await db.daily_logs.find_one({"date": log_data.date})
    if existing:
        await db.daily_logs.update_one({"date": log_data.date}, {"$set": doc})
    else:
        doc["created_at"] = datetime.now(timezone.utc).isoformat()
        await db.daily_logs.insert_one(doc)
    return {"status": "saved", "date": log_data.date}


@api_router.post("/review/generate")
async def generate_review(req: ReviewRequest):
    log = await db.daily_logs.find_one({"date": req.date}, {"_id": 0})
    if not log or not log.get("entries"):
        raise HTTPException(status_code=400, detail="No log data found for this date. Please log activities first.")

    custom_acts = await db.custom_activities.find({}, {"_id": 0}).to_list(100)
    all_activities = DEFAULT_ACTIVITIES + [{"id": a["id"], "name": a["name"]} for a in custom_acts]
    act_map = {a["id"]: a["name"] for a in all_activities}

    d = datetime.strptime(req.date, "%Y-%m-%d")
    dow = (d.weekday() + 1) % 7
    day_name = DAY_NAMES[dow]
    is_weekend = dow == 0
    is_half_day = dow == 6

    entries_text = ""
    for act_id, entry in log.get("entries", {}).items():
        if not entry:
            continue
        act_name = act_map.get(act_id, act_id)
        time_str = ""
        if entry.get("startTime") and entry.get("endTime"):
            mins = calc_minutes(entry["startTime"], entry["endTime"])
            time_str = f" ({entry['startTime']}-{entry['endTime']}, {mins} mins)"

        entries_text += f"\n**{act_name}**{time_str}\n"
        quality = entry.get("quality", "N/A")
        entries_text += f"  Quality: {quality}/5\n"

        for k, v in entry.items():
            if k not in ("startTime", "endTime", "quality") and v:
                label = k.replace("_", " ").title()
                entries_text += f"  {label}: {v}\n"

    mood = log.get("mood", "not specified")

    prompt = f"""You are a personal productivity coach and lifestyle mentor. Review the following daily activity log.

**Date**: {req.date} ({day_name})
{"**Note**: This is a half-day working Saturday." if is_half_day else ""}
{"**Note**: This is Sunday - a rest day off from work." if is_weekend else ""}

**Mood**: {mood}

**Activities Logged**:
{entries_text}

**User's Schedule Context**:
- Work: 8 AM - 7 PM weekdays, half day Saturday, off Sunday
- Daily goals: Gym (1 hr), Hobbies (Chess, Guitar, TV/Movies, Reading, Journalling, Shopping, Startup idea, Articles, AI Knowledge), Job Prep, Family Time
- Goal: Balance work with personal growth, fitness, hobbies, and family

Please provide a comprehensive daily review in this format:

## Daily Score: [X]/10

## Day Summary
[2-3 sentence overview]

## Wins
- [bullet points]

## Areas for Improvement
- [bullet points]

## Learning Highlights
- [key things learned]

## Tomorrow's Focus
1. [goal 1]
2. [goal 2]
3. [goal 3]

## Balance Check
[work-life balance assessment]

## Pro Tips
- [1-2 actionable tips based on today's patterns]"""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"review-{req.date}-{uuid.uuid4().hex[:8]}",
            system_message="You are an expert personal productivity coach. Provide detailed, actionable, and encouraging daily reviews. Be specific with advice based on actual logged data."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        response = await chat.send_message(UserMessage(text=prompt))

        review_doc = {
            "date": req.date,
            "review_text": response,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        existing = await db.reviews.find_one({"date": req.date})
        if existing:
            await db.reviews.update_one({"date": req.date}, {"$set": review_doc})
        else:
            await db.reviews.insert_one(review_doc)

        return {"date": req.date, "review_text": response}

    except Exception as e:
        logger.error(f"Error generating review: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/reviews/{date}")
async def get_review(date: str):
    review = await db.reviews.find_one({"date": date}, {"_id": 0})
    if not review:
        return {"date": date, "review_text": None}
    return review


@api_router.get("/reviews")
async def get_all_reviews():
    reviews = await db.reviews.find({}, {"_id": 0}).sort("date", -1).to_list(100)
    return reviews


@api_router.get("/stats/weekly")
async def get_weekly_stats(date: str = None):
    if not date:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    week_dates = get_week_dates(date)
    logs = await db.daily_logs.find({"date": {"$in": week_dates}}, {"_id": 0}).to_list(7)
    log_map = {l["date"]: l for l in logs}

    total_activities = 0
    total_quality = 0
    quality_count = 0
    activity_stats = {}
    daily_summary = []

    for d in week_dates:
        log = log_map.get(d, {})
        entries = log.get("entries", {})
        day_count = 0
        for act_id, entry in entries.items():
            if not entry:
                continue
            day_count += 1
            total_activities += 1
            if act_id not in activity_stats:
                activity_stats[act_id] = {"count": 0, "total_quality": 0, "total_minutes": 0}
            activity_stats[act_id]["count"] += 1
            if entry.get("quality"):
                q = int(entry["quality"])
                activity_stats[act_id]["total_quality"] += q
                total_quality += q
                quality_count += 1
            if entry.get("startTime") and entry.get("endTime"):
                activity_stats[act_id]["total_minutes"] += calc_minutes(entry["startTime"], entry["endTime"])

        daily_summary.append({
            "date": d,
            "activities_logged": day_count,
            "mood": log.get("mood"),
            "has_log": d in log_map
        })

    breakdown = []
    for act_id, stats in activity_stats.items():
        avg_q = round(stats["total_quality"] / stats["count"], 1) if stats["count"] else 0
        breakdown.append({
            "activity_id": act_id,
            "days_logged": stats["count"],
            "avg_quality": avg_q,
            "total_minutes": stats["total_minutes"]
        })

    return {
        "week_dates": week_dates,
        "total_activities_logged": total_activities,
        "average_quality": round(total_quality / quality_count, 1) if quality_count else 0,
        "days_with_logs": sum(1 for d in daily_summary if d["has_log"]),
        "daily_summary": daily_summary,
        "activity_breakdown": sorted(breakdown, key=lambda x: x["days_logged"], reverse=True)
    }


@api_router.get("/library")
async def get_library(filter_type: str = "all"):
    logs = await db.daily_logs.find({}, {"_id": 0, "date": 1, "entries": 1}).to_list(1000)
    items = []
    for log in logs:
        date = log.get("date", "")
        entries = log.get("entries", {})
        if "reading" in entries and entries["reading"].get("bookTitle"):
            e = entries["reading"]
            items.append({"type": "book", "title": e["bookTitle"], "date": date, "pages": e.get("pagesRead", 0), "rating": e.get("quality", 0)})
        if "tv" in entries and entries["tv"].get("title"):
            e = entries["tv"]
            items.append({"type": e.get("mediaType", "tv"), "title": e["title"], "date": date, "rating": e.get("quality", 0), "genre": e.get("genre", "")})
        if "articles" in entries and entries["articles"].get("articleTitle"):
            e = entries["articles"]
            items.append({"type": "article", "title": e["articleTitle"], "date": date, "url": e.get("articleUrl", ""), "topic": e.get("articleTopic", "")})
    if filter_type != "all":
        items = [i for i in items if i["type"] == filter_type]
    return sorted(items, key=lambda x: x["date"], reverse=True)


@api_router.get("/history")
async def get_history():
    logs = await db.daily_logs.find({}, {"_id": 0}).sort("date", -1).to_list(200)
    history = []
    for log in logs:
        entries = log.get("entries", {})
        count = len([k for k, v in entries.items() if v])
        history.append({"date": log["date"], "mood": log.get("mood"), "activity_count": count, "activities": list(entries.keys())})
    return history


@api_router.get("/history/{date}")
async def get_history_detail(date: str):
    log = await db.daily_logs.find_one({"date": date}, {"_id": 0})
    review = await db.reviews.find_one({"date": date}, {"_id": 0})
    return {
        "log": log or {"date": date, "mood": None, "entries": {}},
        "review": review
    }


@api_router.get("/custom-activities")
async def get_custom_activities():
    acts = await db.custom_activities.find({}, {"_id": 0}).to_list(100)
    return acts


@api_router.post("/custom-activities")
async def create_custom_activity(activity: CustomActivityCreate):
    doc = activity.dict()
    doc["id"] = f"custom_{uuid.uuid4().hex[:8]}"
    doc["isCustom"] = True
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.custom_activities.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.delete("/custom-activities/{activity_id}")
async def delete_custom_activity(activity_id: str):
    result = await db.custom_activities.delete_one({"id": activity_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Activity not found")
    return {"status": "deleted"}


@api_router.get("/settings/{key}")
async def get_setting(key: str):
    s = await db.settings.find_one({"key": key}, {"_id": 0})
    if not s:
        return {"key": key, "value": None}
    return s


@api_router.put("/settings/{key}")
async def update_setting(key: str, update: SettingUpdate):
    await db.settings.update_one(
        {"key": key},
        {"$set": {"key": key, "value": update.value, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"key": key, "value": update.value}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
