import unittest

from scripts.overture.import_india import BBOX, map_place, point_coordinates, slugify


class ImportIndiaTests(unittest.TestCase):
    def setUp(self):
        self.categories = {
            "schools-education": "school-id",
            "hospitals-clinics": "hospital-id",
            "other": "other-id",
            "__tenant_id": "tenant-id",
            "__domain_id": "domain-id",
        }

    def test_maps_nested_place_to_published_unverified_listing(self):
        place = {
            "id": "overture-123",
            "names": {"primary": "Fortis Hospital"},
            "geometry": {"coordinates": [77.5946, 12.9716]},
            "addresses": [{
                "freeform": "154/9, Bannerghatta Road",
                "locality": "Bengaluru",
                "region": "Karnataka",
                "postcode": "560076",
            }],
            "categories": {"primary": "hospital"},
            "websites": ["https://example.test"],
            "phones": ["+91 80 0000 0000"],
            "emails": ["care@example.test"],
            "brand": {"names": {"primary": "Fortis"}},
        }

        listing = map_place(place, self.categories, 1, set(), "2026-09-03T00:00:00+00:00")

        self.assertEqual(listing["category_id"], "hospital-id")
        self.assertEqual(listing["country_code"], "IN")
        self.assertEqual(listing["status"], "published")
        self.assertEqual(listing["verification_status"], "unverified")
        self.assertIsNone(listing.get("owner_user_id"))
        self.assertTrue(listing["slug"].startswith("fortis-hospital-"))
        self.assertEqual(listing["short_description"], "Brand: Fortis")

    def test_sets_requested_owner_user_id(self):
        place = {
            "id": "owned-123",
            "names": {"primary": "Owned Place"},
            "geometry": {"coordinates": [78.0, 20.0]},
            "addresses": [{"freeform": "Main Road"}],
            "categories": {"primary": "school"},
        }
        categories = {**self.categories, "__owner_user_id": "user-id"}

        listing = map_place(place, categories, 1, set(), "now")

        self.assertEqual(listing["owner_user_id"], "user-id")

    def test_unknown_category_uses_other(self):
        place = {
            "id": "unknown-123",
            "names": {"primary": "Community Place"},
            "geometry": {"coordinates": [78.0, 20.0]},
            "addresses": [{"freeform": "Main Road"}],
            "categories": {"primary": "unmapped_type"},
        }

        listing = map_place(place, self.categories, 1, set(), "now")

        self.assertEqual(listing["category_id"], "other-id")

    def test_uses_locality_when_street_address_is_missing(self):
        place = {
            "names": {"primary": "No Address"},
            "geometry": {"coordinates": [78.0, 20.0]},
            "addresses": [{"locality": "Mumbai", "region": "MH"}],
        }

        listing = map_place(place, self.categories, 1, set(), "now")

        self.assertEqual(listing["address_line_1"], "Mumbai")
        self.assertIn("Address details unavailable", listing["short_description"])

    def test_rejects_out_of_bounds_coordinates(self):
        place = {
            "names": {"primary": "Outside India"},
            "geometry": {"coordinates": [BBOX[2] + 1, BBOX[3]]},
            "addresses": [{"freeform": "Some Road"}],
        }

        with self.assertRaises(ValueError):
            map_place(place, self.categories, 1, set(), "now")

    def test_slug_is_ascii_and_coordinates_support_geojson(self):
        self.assertEqual(slugify("Taj Mahal / आगरा"), "taj-mahal")
        self.assertEqual(point_coordinates({"coordinates": [78.0421, 27.1751]}), (78.0421, 27.1751))


if __name__ == "__main__":
    unittest.main()