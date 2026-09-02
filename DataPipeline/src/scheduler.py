"""Simple background scheduler: refresh all eight tracks every two days."""
from __future__ import annotations

import argparse
import time

from refresh_pipeline import refresh_all_tracks


def run_scheduler(interval_days: int = 2) -> None:
    interval_seconds = interval_days * 24 * 60 * 60
    while True:
        print("[scheduler] starting refresh_all_tracks()")
        refresh_all_tracks()
        print(f"[scheduler] next refresh in {interval_days} days")
        time.sleep(interval_seconds)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--interval-days", type=int, default=2)
    args = parser.parse_args()
    run_scheduler(args.interval_days)
