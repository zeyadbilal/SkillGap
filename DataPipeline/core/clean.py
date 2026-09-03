"""
Clean raw job data + extract skills via keyword matching.
"""

import re
import json
import os
import hashlib
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
RAW_DIR = os.path.join(DATA_DIR, "raw")
CLEAN_DIR = os.path.join(DATA_DIR, "clean")
SKILLS_DIR = os.path.join(DATA_DIR, "skills")
DICT_PATH = os.path.join(BASE_DIR, "config", "skills_dictionary.json")


def load_skills_dictionary():
    with open(DICT_PATH, "r") as f:
        raw = json.load(f)
    return {track: [s.lower().strip() for s in skills] for track, skills in raw.items()}


def normalize_text(text):
    if not isinstance(text, str):
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"[^a-zA-Z0-9\s\+\#\.\/\-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text.lower()


def clean_jobs(raw_df):
    df = raw_df.copy()
    before = len(df)
    df["job_title"] = df["job_title"].apply(lambda x: x.strip() if isinstance(x, str) else "")
    df["description_text"] = df["description_text"].apply(lambda x: x.strip() if isinstance(x, str) else "")
    df = df[df["job_title"].str.len() > 0]
    df = df[df["description_text"].str.len() > 0]
    df = df.drop_duplicates(subset=["job_title", "company", "description_text"])
    df = df.reset_index(drop=True)
    after = len(df)
    print(f"  Clean: {before} raw -> {after} clean (dropped {before - after})")
    return df


def extract_skills(clean_df, track, skills_dict):
    track_skills = skills_dict.get(track, [])
    extracted_rows = []
    rows_with_zero = 0

    def stable_job_id(row):
        source_value = row.get("source")
        source = str(source_value).strip() if pd.notna(source_value) and str(source_value).strip() else "unknown"
        source_id = row.get("source_job_id")
        if pd.notna(source_id) and str(source_id).strip():
            return f"{source}:{str(source_id).strip()}"
        url = row.get("url")
        if pd.notna(url) and str(url).strip():
            return str(url).strip()
        identity = f"{source}|{row.get('job_title', '')}|{row.get('company', '')}".lower()
        return f"generated:{hashlib.sha256(identity.encode('utf-8')).hexdigest()[:20]}"

    for _, row in clean_df.iterrows():
        text = normalize_text(row["description_text"])
        found = [s for s in track_skills if re.search(r"\b" + re.escape(s) + r"\b", text)]
        if not found:
            rows_with_zero += 1
        for skill in found:
            extracted_rows.append({"job_id": stable_job_id(row), "skill": skill, "domain": track})

    print(f"  Extract: {len(extracted_rows)} skill matches, {rows_with_zero} jobs with 0 skills")
    return pd.DataFrame(extracted_rows, columns=["job_id", "skill", "domain"])


def compute_skill_frequency(extracted_df):
    if extracted_df.empty:
        return pd.DataFrame(columns=["skill", "count"])
    freq = extracted_df["skill"].value_counts().reset_index()
    freq.columns = ["skill", "count"]
    freq = freq.sort_values("count", ascending=False).reset_index(drop=True)
    return freq


def run_pipeline_for_track(track):
    print(f"\n{'='*50}")
    print(f"Pipeline: {track}")
    print(f"{'='*50}")

    slug = track.lower().replace(" ", "_").replace("/", "_")
    raw_file = os.path.join(RAW_DIR, f"{slug}_jobs.csv")
    if not os.path.exists(raw_file):
        print(f"  [SKIP] No raw file: {raw_file}")
        return None

    raw_df = pd.read_csv(raw_file)
    print(f"  Loaded {len(raw_df)} raw rows")

    clean_df = clean_jobs(raw_df)
    os.makedirs(CLEAN_DIR, exist_ok=True)
    clean_df.to_csv(os.path.join(CLEAN_DIR, f"{slug}_clean.csv"), index=False)

    skills_dict = load_skills_dictionary()
    extracted_df = extract_skills(clean_df, track, skills_dict)
    os.makedirs(SKILLS_DIR, exist_ok=True)
    extracted_df.to_csv(os.path.join(SKILLS_DIR, f"{slug}_skills.csv"), index=False)

    freq_df = compute_skill_frequency(extracted_df)
    freq_df.to_csv(os.path.join(SKILLS_DIR, f"{slug}_frequency.csv"), index=False)

    return {"clean": clean_df, "extracted": extracted_df, "frequency": freq_df}


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python clean.py <track_name>")
        sys.exit(1)
    run_pipeline_for_track(sys.argv[1])
