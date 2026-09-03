"""
Data quality checks for cleaned job data and extracted skills.
"""

import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
CLEAN_DIR = os.path.join(DATA_DIR, "clean")
SKILLS_DIR = os.path.join(DATA_DIR, "skills")


def check_clean_file(track):
    slug = track.lower().replace(" ", "_").replace("/", "_")
    clean_file = os.path.join(CLEAN_DIR, f"{slug}_clean.csv")
    if not os.path.exists(clean_file):
        print(f"  [FAIL] Clean file not found: {clean_file}")
        return False

    df = pd.read_csv(clean_file)
    passed = True

    missing_title = df["job_title"].isna().sum() + (df["job_title"].str.strip() == "").sum()
    if missing_title > 0:
        print(f"  [FAIL] {missing_title} rows missing job_title")
        passed = False
    else:
        print(f"  [PASS] No missing job_title")

    missing_desc = df["description_text"].isna().sum() + (df["description_text"].str.strip() == "").sum()
    if missing_desc > 0:
        print(f"  [FAIL] {missing_desc} rows missing description_text")
        passed = False
    else:
        print(f"  [PASS] No missing description_text")

    dupes = df.duplicated(subset=["job_title", "company", "description_text"]).sum()
    if dupes > 0:
        print(f"  [FAIL] {dupes} exact duplicate rows")
        passed = False
    else:
        print(f"  [PASS] No exact duplicates")

    print(f"  Total rows: {len(df)}")
    return passed


def check_skills_file(track):
    slug = track.lower().replace(" ", "_").replace("/", "_")
    skills_file = os.path.join(SKILLS_DIR, f"{slug}_skills.csv")
    clean_file = os.path.join(CLEAN_DIR, f"{slug}_clean.csv")

    if not os.path.exists(skills_file):
        print(f"  [FAIL] Skills file not found: {skills_file}")
        return False

    skills_df = pd.read_csv(skills_file)
    clean_df = pd.read_csv(clean_file) if os.path.exists(clean_file) else pd.DataFrame()

    jobs_with_skills = set(skills_df["job_id"].unique()) if not skills_df.empty else set()
    total_jobs = len(clean_df)
    jobs_without_skills = total_jobs - len(jobs_with_skills)

    if jobs_without_skills > 0:
        pct = (jobs_without_skills / total_jobs * 100) if total_jobs > 0 else 0
        print(f"  [WARN] {jobs_without_skills}/{total_jobs} jobs ({pct:.1f}%) have 0 extracted skills")
    else:
        print(f"  [PASS] All jobs have at least 1 skill")

    print(f"  Total skill matches: {len(skills_df)}, Unique skills: {skills_df['skill'].nunique() if not skills_df.empty else 0}")
    return jobs_without_skills == 0


def run_checks(track):
    print(f"\nQuality checks: {track}")
    print("-" * 40)
    c1 = check_clean_file(track)
    c2 = check_skills_file(track)
    return c1 and c2


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python quality_check.py <track_name>")
        sys.exit(1)
    passed = run_checks(sys.argv[1])
    print(f"\nResult: {'ALL PASSED' if passed else 'SOME FAILED'}")
