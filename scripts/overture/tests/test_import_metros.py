import unittest

from scripts.overture.import_metros import category_id_for, is_employer_candidate
from scripts.overture.enrich_tech_careers import board_from_url, candidate_board_urls


class MetroCategoryTests(unittest.TestCase):
    def setUp(self):
        self.category_ids = {
            "restaurants-cafes": "restaurants-id",
            "temples-religious": "religious-id",
            "independent-retail": "retail-id",
            "other": "other-id",
        }

    def test_maps_namespaced_overture_category(self):
        self.assertEqual(
            category_id_for({"value": "amenity:restaurant"}, self.category_ids),
            "restaurants-id",
        )

    def test_maps_common_overture_alias(self):
        self.assertEqual(
            category_id_for("place_of_worship", self.category_ids),
            "religious-id",
        )

    def test_unknown_category_still_uses_other(self):
        self.assertEqual(
            category_id_for("unknown_type", self.category_ids),
            "other-id",
        )

    def test_employer_candidate_requires_real_company_website(self):
        self.assertTrue(is_employer_candidate("Acme Technologies", "https://acme.example"))
        self.assertFalse(is_employer_candidate("Acme Computer Repair", "https://acme.example"))
        self.assertFalse(is_employer_candidate("Acme Technologies", "https://www.linkedin.com/company/acme"))
        self.assertFalse(is_employer_candidate("Acme Technologies", None))

    def test_accepts_supported_board_hosts_and_extracts_token(self):
        self.assertEqual(
            board_from_url("https://job-boards.greenhouse.io/postman/jobs/123"),
            ("greenhouse", "postman", "https://job-boards.greenhouse.io/postman"),
        )

    def test_ignores_non_ats_links(self):
        html = '<a href="/careers">Careers</a><a href="https://example.com/jobs">Jobs</a>'
        self.assertEqual(candidate_board_urls(html, "https://example.com"), [])

    def test_extracts_ats_links_from_company_page(self):
        html = '<a href="https://jobs.ashbyhq.com/acme">View jobs</a>'
        self.assertEqual(
            candidate_board_urls(html, "https://acme.example"),
            ["https://jobs.ashbyhq.com/acme"],
        )


if __name__ == "__main__":
    unittest.main()
