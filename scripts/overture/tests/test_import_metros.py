import unittest

from scripts.overture.import_metros import category_id_for


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


if __name__ == "__main__":
    unittest.main()
