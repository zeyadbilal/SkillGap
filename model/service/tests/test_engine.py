import unittest
from unittest.mock import patch

from model.service import engine


class EngineParityTests(unittest.TestCase):
    def setUp(self):
        engine._nlp_loaded = True
        engine._nlp = None

    def test_document_with_no_detected_skills_is_rejected(self):
        cv_text = (
            "Experienced professional focused on communication, planning, mentoring, "
            "documentation, and stakeholder coordination across several organizations."
        )

        with self.assertRaises(engine.CvAnalysisError) as context:
            engine.analyze_cv({"cvText": cv_text})

        self.assertEqual(context.exception.error_code, "NO_SKILLS_DETECTED")

    def test_uses_fixed_analysis_limits(self):
        result = engine.analyze_cv(
            {
                "cvText": (
                    "Backend developer who built Node.js and Express services with "
                    "PostgreSQL, Redis, Docker, Git and Linux in production."
                ),
                "track": "Backend Development",
            }
        )

        self.assertEqual(result["profileSummary"]["track"], "Backend Development")
        self.assertEqual(result["profileSummary"]["marketSkillsReviewed"], 12)
        self.assertLessEqual(len(result["learningRoadmap"]), 3)
        self.assertTrue(all(len(month["skills"]) <= 3 for month in result["learningRoadmap"]))

    def test_explicit_track_preserves_legacy_rankings(self):
        result = engine.analyze_cv(
            {
                "cvText": (
                    "Machine Learning Engineer with 2 years experience building computer vision systems. "
                    "Skills: Python, TensorFlow, PyTorch, FastAPI, Docker, Git, Linux, Azure. "
                    "Built traffic sign detection using YOLO and deployed with FastAPI."
                ),
                "track": "Machine Learning / AI",
            }
        )

        self.assertEqual(
            result["profileSummary"],
            {
                "track": "Machine Learning / AI",
                "matchScore": 57,
                "detectedSkills": 11,
                "missingSkills": 7,
                "marketSkillsReviewed": 12,
                "bestSkills": ["python", "machine learning", "llm", "sql", "pytorch"],
            },
        )
        self.assertEqual(
            [item["skill"] for item in result["skillGaps"]],
            ["llm", "sql", "ci/cd", "r", "kubernetes", "model evaluation", "scikit-learn"],
        )
        self.assertEqual(
            [item["priority"] for item in result["skillGaps"]],
            [8, 6, 4, 4, 4, 4, 4],
        )
        self.assertEqual(result["pipeline"], {"extractor": "python-spacy"})

    def test_extractor_failure_preserves_legacy_fallback_label(self):
        with patch.object(engine, "extract_python_style", side_effect=RuntimeError("failed")):
            result = engine.analyze_cv(
                {"cvText": "Backend engineer building Python and Flask applications in production."}
            )

        self.assertEqual(result["pipeline"]["extractor"], "marketData-regex-python-error")

    def test_rejects_short_cv_text(self):
        with self.assertRaisesRegex(ValueError, "at least 20 characters"):
            engine.analyze_cv({"cvText": "too short"})


if __name__ == "__main__":
    unittest.main()
