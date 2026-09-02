"""Clean raw job rows, extract dictionary skills, and build frequency counts."""
from __future__ import annotations

import argparse
import csv
import html
import json
import re
from collections import Counter
from pathlib import Path
from typing import Iterable

RAW_COLUMNS = ["job_title", "company", "description_text", "source", "date_collected", "track"]


def load_skills_dictionary(path: Path) -> dict[str, list[str]]:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def normalize_text(value: object) -> str:
    text = html.unescape(str(value or ""))
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"[^\w\s./+#&-]", " ", text, flags=re.UNICODE)
    return re.sub(r"\s+", " ", text).strip()


def _skill_pattern(skill: str) -> re.Pattern[str]:
    escaped = re.escape(skill.strip()).replace(r"\ ", r"\s+")
    return re.compile(r"(?<!\w)" + escaped + r"(?!\w)", re.IGNORECASE)


def extract_skills(text: str, skills: Iterable[str]) -> list[str]:
    found = [skill for skill in skills if _skill_pattern(skill).search(text)]
    return sorted(set(found), key=str.casefold)


def clean_rows(rows: Iterable[dict[str, str]], track: str, dictionary: dict[str, list[str]]) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    cleaned: list[dict[str, str]] = []
    extracted: list[dict[str, str]] = []
    seen: set[tuple[str, ...]] = set()
    track_skills = dictionary[track]

    for row in rows:
        normalized = {column: normalize_text(row.get(column, "")) for column in RAW_COLUMNS}
        normalized["track"] = track
        identity = tuple(normalized[column].casefold() for column in RAW_COLUMNS)
        if not normalized["job_title"] or not normalized["description_text"] or identity in seen:
            continue
        seen.add(identity)
        job_id = str(len(cleaned) + 1)
        searchable_text = f"{normalized['job_title']} {normalized['description_text']}"
        skills = extract_skills(searchable_text, track_skills)
        cleaned.append({"job_id": job_id, **normalized, "skills": "; ".join(skills)})
        extracted.extend({"job_id": job_id, "skill": skill, "domain": track} for skill in skills)
    return cleaned, extracted


def write_outputs(cleaned: list[dict[str, str]], extracted: list[dict[str, str]], output_clean: Path, output_skills: Path, output_frequency: Path) -> dict[str, int]:
    output_clean.parent.mkdir(parents=True, exist_ok=True)
    output_skills.parent.mkdir(parents=True, exist_ok=True)
    output_frequency.parent.mkdir(parents=True, exist_ok=True)
    with output_clean.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["job_id", *RAW_COLUMNS, "skills"])
        writer.writeheader()
        writer.writerows(cleaned)
    with output_skills.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["job_id", "skill", "domain"])
        writer.writeheader()
        writer.writerows(extracted)
    counts = Counter(row["skill"] for row in extracted)
    with output_frequency.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=["skill", "count"])
        writer.writeheader()
        writer.writerows({"skill": skill, "count": count} for skill, count in sorted(counts.items(), key=lambda item: (-item[1], item[0].casefold())))
    skill_counts = [len(row["skills"].split("; ")) if row["skills"] else 0 for row in cleaned]
    return {"cleaned": len(cleaned), "dropped": 0, "zero_skill": sum(not row["skills"] for row in cleaned), "skills": len(extracted), "skills_min": min(skill_counts, default=0), "skills_max": max(skill_counts, default=0), "skills_average": sum(skill_counts) / len(skill_counts) if skill_counts else 0.0}


def clean_file(input_path: Path, track: str, dictionary_path: Path, output_clean: Path, output_skills: Path, output_frequency: Path) -> dict[str, int]:
    with input_path.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    dictionary = load_skills_dictionary(dictionary_path)
    cleaned, extracted = clean_rows(rows, track, dictionary)
    stats = write_outputs(cleaned, extracted, output_clean, output_skills, output_frequency)
    stats["dropped"] = len(rows) - len(cleaned)
    print(f"[clean] {track}: cleaned={stats['cleaned']} dropped={stats['dropped']} zero-skill={stats['zero_skill']}")
    print(f"[skills] {track}: average={stats['skills_average']:.2f} min={stats['skills_min']} max={stats['skills_max']} total_matches={stats['skills']}")
    return stats


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--track", required=True)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--dictionary", type=Path, default=Path(__file__).resolve().parent.parent / "config" / "skills_dictionary.json")
    parser.add_argument("--clean-output", type=Path, required=True)
    parser.add_argument("--skills-output", type=Path, required=True)
    parser.add_argument("--frequency-output", type=Path, required=True)
    args = parser.parse_args()
    clean_file(args.input, args.track, args.dictionary, args.clean_output, args.skills_output, args.frequency_output)


if __name__ == "__main__":
    main()
