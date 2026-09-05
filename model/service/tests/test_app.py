import unittest

from model.service.app import create_app


class ModelServiceHttpTests(unittest.TestCase):
    def setUp(self):
        self.client = create_app().test_client()

    def test_analyze_returns_raw_legacy_result(self):
        response = self.client.post(
            "/analyze",
            json={
                "cvText": (
                    "Backend developer with Node.js, Express, PostgreSQL, Redis, "
                    "Docker, Git and Linux production experience."
                ),
                "track": "Backend Development",
            },
        )

        self.assertEqual(response.status_code, 200)
        result = response.get_json()
        self.assertNotIn("success", result)
        self.assertEqual(result["profileSummary"]["track"], "Backend Development")
        self.assertEqual(result["profileSummary"]["marketSkillsReviewed"], 12)
        self.assertLessEqual(len(result["learningRoadmap"]), 3)

    def test_analyze_rejects_document_without_skills(self):
        response = self.client.post(
            "/analyze",
            json={
                "cvText": (
                    "Experienced professional focused on communication, planning, "
                    "mentoring, documentation, and stakeholder coordination."
                ),
            },
        )

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.get_json()["errorCode"], "NO_SKILLS_DETECTED")

    def test_analyze_rejects_removed_options(self):
        response = self.client.post(
            "/analyze",
            json={
                "cvText": "Backend engineer with enough experience for analysis.",
                "topSkillsLimit": 8,
            },
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["errorCode"], "VALIDATION_ERROR")

    def test_analyze_rejects_invalid_json(self):
        response = self.client.post("/analyze", data="not-json", content_type="text/plain")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["errorCode"], "INVALID_CV_TEXT")


if __name__ == "__main__":
    unittest.main()
