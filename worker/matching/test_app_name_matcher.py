import tempfile
import unittest
from pathlib import Path

from worker.matching.app_name_matcher import (
    load_app_name_dictionary,
    match_app_name,
    match_app_names,
    normalize_app_name,
)


class AppNameMatcherTests(unittest.TestCase):
    def test_load_app_name_dictionary_reads_canonical_names_and_aliases(self) -> None:
        entries = load_app_name_dictionary(Path("data/app-name-dictionary.json"))

        self.assertEqual(entries[0].canonical_name, "メール")
        self.assertIn("Mail", entries[0].aliases)

    def test_match_app_name_uses_alias_to_return_canonical_display_name(self) -> None:
        entries = load_app_name_dictionary(Path("data/app-name-dictionary.json"))

        result = match_app_name("Mail", entries, ocr_confidence=0.8)

        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result.display_name, "メール")
        self.assertEqual(result.raw_text, "Mail")
        self.assertEqual(result.match_reason, "exact")
        self.assertAlmostEqual(result.confidence, 0.76)

    def test_normalized_matching_handles_case_spaces_and_symbols(self) -> None:
        entries = load_app_name_dictionary(Path("data/app-name-dictionary.json"))

        result = match_app_name(" c a l e n d a r ! ", entries, ocr_confidence=1.0)

        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result.display_name, "カレンダー")
        self.assertEqual(result.match_reason, "normalized")
        self.assertEqual(normalize_app_name(" c a l e n d a r ! "), "calendar")

    def test_match_app_names_deduplicates_by_canonical_name_and_keeps_best_score(self) -> None:
        entries = load_app_name_dictionary(Path("data/app-name-dictionary.json"))

        results = match_app_names(
            [
                {"rawText": "Mail", "confidence": 0.5, "frame": 1},
                {"rawText": "メール", "confidence": 0.95, "frame": 2},
                {"rawText": "Memo", "confidence": 0.7, "frame": 2},
            ],
            entries,
        )

        self.assertEqual([result.display_name for result in results], ["メール", "メモ"])
        self.assertEqual(results[0].raw_text, "メール")
        self.assertEqual(results[0].frame, 2)

    def test_match_app_names_preserves_review_location_metadata(self) -> None:
        entries = load_app_name_dictionary(Path("data/app-name-dictionary.json"))

        results = match_app_names(
            [
                {
                    "rawText": "Mail",
                    "confidence": 0.9,
                    "frame": 8,
                    "page": 3,
                    "pageFrameCount": 4,
                    "boundingBox": {"x": 12, "y": 250, "width": 80, "height": 16},
                    "frameWidth": 720,
                    "frameHeight": 1280,
                }
            ],
            entries,
        )

        self.assertEqual(results[0].as_dict()["page"], 3)
        self.assertEqual(results[0].as_dict()["pageFrameCount"], 4)
        self.assertEqual(results[0].as_dict()["boundingBox"], {"x": 12, "y": 250, "width": 80, "height": 16})
        self.assertEqual(results[0].as_dict()["homePosition"], {"area": "mainGrid", "row": 1, "column": 1})
        self.assertEqual(results[0].as_dict()["frameWidth"], 720)
        self.assertEqual(results[0].as_dict()["frameHeight"], 1280)

    def test_load_app_name_dictionary_rejects_entries_without_aliases(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            dictionary_path = Path(tmp_dir) / "dictionary.json"
            dictionary_path.write_text('[{"canonicalName":"Broken"}]', encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "aliases"):
                load_app_name_dictionary(dictionary_path)


if __name__ == "__main__":
    unittest.main()
