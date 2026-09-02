"""Small, framework-free data quality checks for the pipeline outputs."""
from __future__ import annotations

import argparse
import csv
from pathlib import Path


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def check_missing_fields(rows: list[dict[str, str]]) -> list[int]:
    return [index for index, row in enumerate(rows, start=2) if not row.get("job_title", "").strip() or not row.get("description_text", "").strip()]


def check_duplicates(rows: list[dict[str, str]]) -> int:
    return len(rows) - len({tuple(row.values()) for row in rows})


def check_zero_skill_rows(rows: list[dict[str, str]]) -> list[str]:
    return [row.get("job_id", str(index)) for index, row in enumerate(rows, start=1) if not row.get("skills", "").strip()]


def run_quality_checks(clean_path: Path) -> dict[str, object]:
    rows = read_csv(clean_path)
    result = {"missing_fields": check_missing_fields(rows), "duplicate_rows": check_duplicates(rows), "zero_skill_rows": check_zero_skill_rows(rows)}
    print(f"[quality] {clean_path}: missing={len(result['missing_fields'])} duplicates={result['duplicate_rows']} zero-skill={len(result['zero_skill_rows'])}")
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--clean-file", type=Path, required=True)
    args = parser.parse_args()
    result = run_quality_checks(args.clean_file)
    raise SystemExit(1 if any(result.values()) else 0)


if __name__ == "__main__":
    main()
