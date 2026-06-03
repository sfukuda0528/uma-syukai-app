import tempfile
import unittest
from pathlib import Path

from worker.frame_extraction.extractor import ExtractedFrame
from worker.ocr.extractor import OcrExtractionError, extract_text_from_frames


class FakeReader:
    def __init__(self, results_by_image: dict[str, list[object]]) -> None:
        self.results_by_image = results_by_image
        self.images: list[str] = []

    def readtext(self, image: str, detail: int = 1, paragraph: bool = False) -> list[object]:
        self.images.append(image)
        return self.results_by_image[image]


class OcrExtractorTests(unittest.TestCase):
    def test_extract_text_from_frames_converts_easyocr_results_to_raw_items(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            frame_path = Path(tmp_dir) / "frame_001.jpg"
            frame_path.write_bytes(b"image")
            reader = FakeReader(
                {
                    str(frame_path): [
                        ([[0, 0], [1, 0], [1, 1], [0, 1]], " Mail ", 0.8123),
                        ([[0, 0], [1, 0], [1, 1], [0, 1]], "", 0.9),
                        ("malformed",),
                    ]
                }
            )

            results = extract_text_from_frames(
                [ExtractedFrame(frame=3, path=str(frame_path))],
                reader=reader,
            )

            self.assertEqual(
                [result.as_dict() for result in results],
                [{"rawText": "Mail", "confidence": 0.81, "frame": 3}],
            )
            self.assertEqual(reader.images, [str(frame_path)])

    def test_extract_text_from_frames_fails_when_frame_file_is_missing(self) -> None:
        reader = FakeReader({})

        with self.assertRaisesRegex(OcrExtractionError, "OCR 対象フレームが見つかりません"):
            extract_text_from_frames([ExtractedFrame(frame=1, path="missing.jpg")], reader=reader)


if __name__ == "__main__":
    unittest.main()
