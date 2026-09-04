import csv
import json
import math
import re
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path

try:
    import spacy
except ImportError:  # pragma: no cover - exercised in deployments without spaCy
    spacy = None


REPO_ROOT = Path(__file__).resolve().parents[2]
SKILL_DICTIONARY_PATH = REPO_ROOT / "DataPipeline" / "config" / "skills_dictionary.json"
SKILLS_DATA_DIR = REPO_ROOT / "DataPipeline" / "data" / "skills"
MARKET_SKILLS_LIMIT = 12
ROADMAP_MONTHS = 3
SKILLS_PER_MONTH = 3

TRACK_FREQUENCY_FILES = OrderedDict(
    [
        ("Backend Development", "backend_development_frequency.csv"),
        ("Frontend Development", "frontend_development_frequency.csv"),
        ("Full-Stack Development", "full-stack_development_frequency.csv"),
        ("Mobile Development", "mobile_development_frequency.csv"),
        ("DevOps & Cloud Engineering", "devops_&_cloud_engineering_frequency.csv"),
        ("Network Administration", "network_administration_frequency.csv"),
        ("Network Security", "network_security_frequency.csv"),
        ("Machine Learning / AI", "machine_learning___ai_frequency.csv"),
    ]
)

PROFICIENCY_LEVELS = {
    "Beginner": 1,
    "Intermediate": 2,
    "Advanced": 3,
    "Expert": 4,
}

_skill_dictionary = None
_skill_items = None
_market_data = None
_nlp = None
_nlp_loaded = False


def normalize_text(text):
    value = str(text or "").lower()
    value = re.sub(r"[^a-z0-9+#./-]+", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def split_sentences(text):
    value = str(text or "").replace("\r", "\n")
    parts = re.split(r"(?<=[.!?])\s+|\n+", value)
    return [part.strip() for part in parts if part.strip()]


def build_skill_aliases(skill):
    base = normalize_text(skill)
    if not base:
        return []

    aliases = []

    def add(value):
        if value and value not in aliases:
            aliases.append(value)

    add(base)
    compact = re.sub(r"\s+", "", base)
    if compact != base:
        add(compact)

    normalized = re.sub(r"\bjs\b", "javascript", base)
    normalized = re.sub(r"\bts\b", "typescript", normalized)
    normalized = re.sub(r"\band\b", "&", normalized)
    add(normalized)

    special_aliases = {
        "node js": "nodejs",
        "express js": "expressjs",
        "vue js": "vuejs",
        "next js": "nextjs",
        "nuxt js": "nuxtjs",
        "rest api": "restful api",
        "ci cd": "cicd",
        "web sockets": "websocket",
    }
    for needle, alias in special_aliases.items():
        if needle in base:
            add(alias)
    return aliases


def phrase_exists(text, phrase):
    return re.search(r"(^|\s)" + re.escape(phrase.strip()) + r"(?=\s|$)", text, re.I) is not None


def load_skill_dictionary():
    global _skill_dictionary
    if _skill_dictionary is not None:
        return _skill_dictionary

    raw = json.loads(SKILL_DICTIONARY_PATH.read_text(encoding="utf-8"))
    result = OrderedDict()
    for track, keywords in raw.items():
        seen = set()
        normalized_keywords = []
        for keyword in keywords if isinstance(keywords, list) else []:
            value = str(keyword).strip().lower()
            if value and value not in seen:
                seen.add(value)
                normalized_keywords.append(value)
        result[track] = normalized_keywords
    _skill_dictionary = result
    return result


def load_skill_items():
    global _skill_items
    if _skill_items is not None:
        return _skill_items

    dedup = OrderedDict()
    for track, skills in load_skill_dictionary().items():
        for skill in skills:
            if skill not in dedup:
                dedup[skill] = {"skill": skill, "tracks": []}
            if track not in dedup[skill]["tracks"]:
                dedup[skill]["tracks"].append(track)
    _skill_items = list(dedup.values())
    return _skill_items


def parse_csv_rows(file_path):
    if not file_path.exists():
        return []
    with file_path.open(encoding="utf-8", newline="") as handle:
        rows = []
        for row in csv.reader(handle):
            if len(row) < 2 or row[0].strip().lower() == "skill":
                continue
            skill = ",".join(row[:-1]).strip()
            try:
                count = int(float(row[-1].strip()))
            except (TypeError, ValueError):
                continue
            if skill:
                rows.append({"skill": skill, "count": count})
        return rows


def load_market_data():
    global _market_data
    if _market_data is not None:
        return _market_data

    result = OrderedDict()
    for track, filename in TRACK_FREQUENCY_FILES.items():
        rows = sorted(
            parse_csv_rows(SKILLS_DATA_DIR / filename),
            key=lambda item: item["count"],
            reverse=True,
        )
        result[track] = [
            {**row, "rank": index + 1, "track": track}
            for index, row in enumerate(rows)
        ]
    _market_data = result
    return result


def extract_market_regex(text):
    searchable_text = normalize_text(text)
    sentences = [
        {"raw": sentence, "searchable": normalize_text(sentence)}
        for sentence in split_sentences(text)
    ]
    hits = OrderedDict()

    for track, keywords in load_skill_dictionary().items():
        for keyword in keywords:
            aliases = build_skill_aliases(keyword)
            matched = [
                sentence["raw"]
                for sentence in sentences
                if any(phrase_exists(sentence["searchable"], alias) for alias in aliases)
            ]
            if not matched and not any(phrase_exists(searchable_text, alias) for alias in aliases):
                continue

            existing = hits.setdefault(
                keyword,
                {"skill": keyword, "tracks": [], "mentions": [], "confidence": 0},
            )
            if track not in existing["tracks"]:
                existing["tracks"].append(track)
            evidence = matched[0] if matched else str(text)[:180].strip()
            if evidence and evidence not in existing["mentions"]:
                existing["mentions"].append(evidence)
            existing["confidence"] = min(
                0.98,
                existing["confidence"] + 0.25 + min(0.15 * len(matched), 0.3),
            )

    return [
        {
            "skill": item["skill"],
            "tracks": item["tracks"],
            "mentions": item["mentions"][:3],
            "confidence": round_decimal(item["confidence"], 2),
        }
        for item in hits.values()
    ]


def load_spacy_model():
    global _nlp, _nlp_loaded
    if _nlp_loaded:
        return _nlp
    _nlp_loaded = True
    if spacy is None:
        return None
    for name in ("en_core_web_trf", "en_core_web_sm"):
        try:
            _nlp = spacy.load(name)
            return _nlp
        except Exception:
            continue
    return None


def mention_count(text, skill):
    pattern = re.compile(r"(?<!\w)" + re.escape(skill.lower()).replace(r"\ ", r"\s+") + r"(?!\w)")
    return len(pattern.findall(text.lower()))


def extract_python_style(cv_text):
    skill_items = load_skill_items()
    nlp = load_spacy_model()
    hits = OrderedDict()

    if nlp is not None:
        phrases = {item["skill"].lower(): item["tracks"] for item in skill_items}
        for entity in nlp(cv_text).ents:
            key = entity.text.strip().lower()
            if key not in phrases:
                continue
            hit = hits.setdefault(key, {"skill": entity.text.strip(), "tracks": [], "mentions": 0})
            for track in phrases[key]:
                if track not in hit["tracks"]:
                    hit["tracks"].append(track)
            hit["mentions"] += 1

    for item in skill_items:
        count = mention_count(cv_text, item["skill"])
        if count <= 0:
            continue
        key = item["skill"].lower()
        hit = hits.setdefault(key, {"skill": item["skill"], "tracks": [], "mentions": 0})
        for track in item["tracks"]:
            if track not in hit["tracks"]:
                hit["tracks"].append(track)
        hit["mentions"] += count

    return [
        {
            "skill": item["skill"],
            "tracks": item["tracks"] or ["Machine Learning / AI"],
            "mentions": item["mentions"],
            "confidence": 0.9 if item["mentions"] > 0 else 0.6,
            "proficiencyLevel": "Intermediate",
        }
        for item in hits.values()
    ]


def infer_proficiency(text, skill):
    searchable_text = normalize_text(text)
    normalized_skill = normalize_text(skill)
    sentence = next(
        (part for part in split_sentences(text) if normalized_skill in normalize_text(part)),
        None,
    )
    window_text = normalize_text(sentence) if sentence else searchable_text
    match = re.search(r"(\d+(?:\.\d+)?)\s*\+?\s*years?", window_text)
    if not match:
        return "Intermediate"
    years = float(match.group(1))
    if years < 0.5:
        return "Beginner"
    if years < 2:
        return "Intermediate"
    if years < 5:
        return "Advanced"
    return "Expert"


def infer_track(detected_skills):
    market_data = load_market_data()
    scores = OrderedDict((track, 0) for track in TRACK_FREQUENCY_FILES)
    for skill in detected_skills:
        for track in skill.get("tracks") or []:
            market_skill = next(
                (
                    row
                    for row in market_data.get(track, [])
                    if normalize_text(row["skill"]) == normalize_text(skill["skill"])
                ),
                None,
            )
            weight = market_skill["count"] if market_skill else 1
            confidence = skill.get("confidence") or 0.5
            scores[track] = scores.get(track, 0) + weight * confidence
    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    return ranked[0][0] if ranked and ranked[0][1] > 0 else "Machine Learning / AI"


def get_market_skills(track, limit=12):
    market_data = load_market_data()
    selected_track = track if track in market_data else infer_track([])
    return market_data.get(selected_track, [])[:limit]


def js_round(value):
    return math.floor(value + 0.5)


def round_decimal(value, places):
    scale = 10**places
    return math.floor(value * scale + 0.5) / scale


def compute_match_score(current_skills, market_skills):
    if not market_skills:
        return 0
    current = {normalize_text(skill["skill"]) for skill in current_skills}
    matched = sum(row["count"] for row in market_skills if normalize_text(row["skill"]) in current)
    total = sum(row["count"] for row in market_skills)
    return js_round((matched / total) * 100) if total > 0 else 0


def compute_priority(demand_score, missing):
    gap_severity = 1 if missing else 0.35
    raw = demand_score * 0.75 + gap_severity * 0.25
    return max(1, min(10, js_round(raw * 10)))


def build_learning_resources(skill_name, track):
    return [
        {"title": f"{skill_name} fundamentals", "type": "course"},
        {"title": f"Build a {skill_name} project", "type": "project"},
        {"title": f"{track} community resources", "type": "community"},
    ]


def summarize_current_skills(detected_skills, cv_text):
    result = []
    for item in detected_skills:
        proficiency = item.get("proficiencyLevel") or infer_proficiency(cv_text, item["skill"])
        result.append(
            {
                "skill": item["skill"],
                "tracks": item.get("tracks") or [],
                "mentions": item.get("mentions") or [],
                "confidence": item.get("confidence") or 0.5,
                "proficiencyLevel": proficiency,
                "proficiencyRank": PROFICIENCY_LEVELS.get(proficiency) or 2,
            }
        )
    return result


def build_skill_gaps(current_skills, market_skills, track):
    current = {normalize_text(skill["skill"]) for skill in current_skills}
    max_count = max([row["count"] for row in market_skills] + [1])
    gaps = []
    for row in market_skills:
        if normalize_text(row["skill"]) in current:
            continue
        demand_score = round_decimal(row["count"] / max_count, 2)
        reason = f"Frequently requested in {track} roles"
        gaps.append(
            {
                "skill": row["skill"],
                "track": track,
                "demandScore": demand_score,
                "count": row["count"],
                "marketRank": row["rank"],
                "priority": compute_priority(demand_score, True),
                "reason": reason,
                "learningResources": build_learning_resources(row["skill"], track),
            }
        )
    return sorted(gaps, key=lambda item: (-item["priority"], -item["count"]))


def build_roadmap(skill_gaps, months_count=3, skills_per_month=3):
    selected = skill_gaps[: months_count * skills_per_month]
    roadmap = []
    for month in range(1, months_count + 1):
        start = (month - 1) * skills_per_month
        month_skills = selected[start : month * skills_per_month]
        if not month_skills:
            break
        names = [item["skill"] for item in month_skills]
        estimated_hours = len(month_skills) * 18
        roadmap.append(
            {
                "month": month,
                "title": f"Focus: {', '.join(names)}",
                "skills": names,
                "projects": [f"Build a small project using {name}" for name in names],
                "estimatedHours": estimated_hours,
                "hoursPerWeek": math.ceil(estimated_hours / 4),
            }
        )
    return roadmap


def build_summary(current_skills, skill_gaps, market_skills, track):
    return {
        "track": track,
        "matchScore": compute_match_score(current_skills, market_skills),
        "detectedSkills": len(current_skills),
        "missingSkills": len(skill_gaps),
        "marketSkillsReviewed": len(market_skills),
        "bestSkills": [skill["skill"] for skill in market_skills[:5]],
    }


def detect_skills(cv_text):
    try:
        detected = extract_python_style(cv_text)
        if detected:
            return detected, "python-spacy"
        return extract_market_regex(cv_text), "marketData-regex-empty-python"
    except Exception:
        return extract_market_regex(cv_text), "marketData-regex-python-error"


def analyze_cv(input_data):
    cv_text = str(input_data.get("cvText") or "").strip()
    if len(cv_text) < 20:
        raise ValueError("cvText must be at least 20 characters")

    detected_skills, extractor = detect_skills(cv_text)
    selected_track = input_data.get("track") or infer_track(detected_skills)
    market_skills = get_market_skills(selected_track, MARKET_SKILLS_LIMIT)
    current_skills = summarize_current_skills(detected_skills, cv_text)
    skill_gaps = build_skill_gaps(current_skills, market_skills, selected_track)
    roadmap = build_roadmap(skill_gaps, ROADMAP_MONTHS, SKILLS_PER_MONTH)
    return {
        "profileSummary": build_summary(current_skills, skill_gaps, market_skills, selected_track),
        "currentSkills": current_skills,
        "skillGaps": skill_gaps,
        "learningRoadmap": roadmap,
        "usefulStuff": {
            "topMarketSkills": [
                {"skill": skill["skill"], "count": skill["count"], "rank": skill["rank"]}
                for skill in market_skills[:5]
            ],
            "nextActions": [
                {"action": f"Study {gap['skill']}", "why": gap["reason"]}
                for gap in skill_gaps[:3]
            ],
        },
        "generatedAt": datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "pipeline": {"extractor": extractor},
    }
