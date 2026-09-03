import os
import sys
import unittest
from unittest.mock import Mock, patch

import pandas as pd

PIPELINE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PIPELINE_DIR)

from scripts import refresh_pipeline
from core.clean import extract_skills
from core.job_classifier import classify_jobs
from scrapers import arbeitnow_scraper


class PipelineRegressionTests(unittest.TestCase):
    def test_dedupe_uses_title_company_when_id_and_url_are_missing(self):
        rows = pd.DataFrame([
            {"track": "Backend Development", "source": "manual", "source_job_id": "", "url": "", "job_title": "Backend A", "company": "One"},
            {"track": "Backend Development", "source": "manual", "source_job_id": "", "url": "", "job_title": "Backend B", "company": "Two"},
        ])
        self.assertEqual(len(refresh_pipeline._dedupe(rows)), 2)

    def test_extracted_job_id_is_stable_across_row_order(self):
        jobs = pd.DataFrame([
            {"source": "feed", "source_job_id": "abc", "url": "", "job_title": "Backend", "company": "One", "description_text": "Python"},
            {"source": "feed", "source_job_id": "xyz", "url": "", "job_title": "Backend", "company": "Two", "description_text": "Python"},
        ])
        first = extract_skills(jobs, "Backend Development", {"Backend Development": ["python"]})
        second = extract_skills(jobs.iloc[::-1], "Backend Development", {"Backend Development": ["python"]})
        self.assertEqual(set(first["job_id"]), {"feed:abc", "feed:xyz"})
        self.assertEqual(set(first["job_id"]), set(second["job_id"]))

    def test_explicit_source_track_is_preserved(self):
        job = {"source_job_id": "1", "job_title": "Software Developer", "description_text": "", "track": "Backend Development"}
        result = classify_jobs([job])
        self.assertEqual([row["track"] for row in result], ["Backend Development"])

    @patch.object(arbeitnow_scraper.requests, "get")
    def test_arbeitnow_invalid_date_does_not_stop_pagination(self, get):
        page_one = Mock()
        page_one.json.return_value = {"data": [{"created_at": "invalid"}], "links": {"next": "page-2"}}
        page_one.raise_for_status.return_value = None
        page_two = Mock()
        page_two.json.return_value = {"data": [{"created_at": "2999-01-01T00:00:00Z", "slug": "future", "title": "Backend Developer", "description": "Python"}], "links": {"next": None}}
        page_two.raise_for_status.return_value = None
        get.side_effect = [page_one, page_two]
        result = arbeitnow_scraper.scrape_all(days_back=7, max_pages=2)
        self.assertEqual(len(result), 1)
        self.assertEqual(get.call_count, 2)


if __name__ == "__main__":
    unittest.main()
