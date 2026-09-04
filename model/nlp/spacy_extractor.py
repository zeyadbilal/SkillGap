#!/usr/bin/env python3
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

try:
    import spacy
except Exception:
    spacy = None


def load_model():
    if not spacy:
        return None
    for name in ("en_core_web_trf", "en_core_web_sm"):
        try:
            return spacy.load(name)
        except Exception:
            continue
    return None


def load_skill_dictionary():
    repo_root = Path(__file__).resolve().parents[2]
    skills_path = repo_root / "DataPipeline" / "config" / "skills_dictionary.json"
    if not skills_path.exists():
        return []

    raw = json.loads(skills_path.read_text(encoding="utf-8"))
    dedup = {}
    for track, skills in raw.items():
        for skill in (skills or []):
            normalized = str(skill).strip()
            if not normalized:
                continue
            key = normalized.lower()
            if key not in dedup:
                dedup[key] = {"skill": normalized, "tracks": set()}
            dedup[key]["tracks"].add(str(track).strip())
    return [
        {"skill": value["skill"], "tracks": sorted(value["tracks"])}
        for value in dedup.values()
    ]


def mention_count(text, skill):
    escaped = re.escape(skill.lower()).replace(r"\ ", r"\s+")
    pattern = re.compile(r"(?<!\w)" + escaped + r"(?!\w)")
    return len(pattern.findall(text.lower()))


def extract_with_spacy(cv_text, skill_items):
    nlp = load_model()
    if not nlp:
        return []

    doc = nlp(cv_text)
    lower_text = cv_text.lower()
    hits = defaultdict(lambda: {"skill": None, "tracks": set(), "mentions": 0})

    phrases = {item["skill"].lower(): item["tracks"] for item in skill_items}
    for ent in doc.ents:
        key = ent.text.strip()
        if key.lower() in phrases:
            canonical_key = key.lower()
            hits[canonical_key]["skill"] = key
            for track in phrases[key.lower()]:
                hits[canonical_key]["tracks"].add(track)
            hits[canonical_key]["mentions"] += 1

    for item in skill_items:
        skill = item["skill"]
        mentions = mention_count(lower_text, skill)
        if mentions > 0:
            canonical_key = skill.lower()
            if not hits[canonical_key]["skill"]:
                hits[canonical_key]["skill"] = skill
            for track in item["tracks"]:
                hits[canonical_key]["tracks"].add(track)
            hits[canonical_key]["mentions"] += mentions

    return hits


def extract_with_regex(cv_text, skill_items):
    lower_text = cv_text.lower()
    hits = defaultdict(lambda: {"skill": None, "tracks": set(), "mentions": 0})
    for item in skill_items:
        skill = item["skill"]
        mentions = mention_count(lower_text, skill)
        if mentions > 0:
            canonical_key = skill.lower()
            hits[canonical_key]["skill"] = skill
            for track in item["tracks"]:
                hits[canonical_key]["tracks"].add(track)
            hits[canonical_key]["mentions"] += mentions
    return hits


def main():
    cv_text = sys.stdin.read().strip()
    if not cv_text:
        print(json.dumps({"error": "no input"}))
        sys.exit(1)

    skill_items = load_skill_dictionary()
    hits = extract_with_spacy(cv_text, skill_items)
    if not hits:
        hits = extract_with_regex(cv_text, skill_items)

    detected = []
    for value in hits.values():
        detected.append(
            {
                "skill": value["skill"],
                "tracks": list(value["tracks"]) if value["tracks"] else ["Machine Learning / AI"],
                "mentions": value["mentions"],
                "confidence": 0.9 if value["mentions"] > 0 else 0.6,
                "proficiencyLevel": "Intermediate",
            }
        )

    track_counts = Counter()
    for item in detected:
        for track in item["tracks"]:
            track_counts[track] += 1

    out = {
        "detectedSkills": detected,
        "inferredTrack": track_counts.most_common(1)[0][0] if track_counts else "Machine Learning / AI",
        "textLength": len(cv_text),
    }
    print(json.dumps(out))


if __name__ == "__main__":
    main()
