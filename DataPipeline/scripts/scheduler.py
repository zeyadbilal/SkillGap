"""
Simple scheduler — calls refresh_all_tracks() every 7 days.
"""

import time
from datetime import datetime
from refresh_pipeline import refresh_all_tracks

REFRESH_INTERVAL_SECONDS = 7 * 24 * 60 * 60  # 7 days


def run():
    print(f"Scheduler started at {datetime.now().isoformat()}")
    print(f"Refresh interval: {REFRESH_INTERVAL_SECONDS // 86400} days")
    while True:
        try:
            refresh_all_tracks()
        except Exception as e:
            print(f"Scheduler error: {e}")
        print(f"Next refresh in {REFRESH_INTERVAL_SECONDS // 86400} days...")
        time.sleep(REFRESH_INTERVAL_SECONDS)


if __name__ == "__main__":
    run()
