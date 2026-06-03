import tempfile
import unittest
import struct
import sys
import types
from pathlib import Path
from unittest.mock import patch

from worker.frame_extraction.extractor import ExtractedFrame
from worker.ocr.extractor import OcrExtractionError, create_easyocr_reader, extract_text_from_frames


class FakeReader:
    def __init__(self, results_by_image: dict[str, list[object]]) -> None:
        self.results_by_image = results_by_image
        self.images: list[str] = []

    def readtext(self, image: str, detail: int = 1, paragraph: bool = False) -> list[object]:
        self.images.append(image)
        return self.results_by_image[image]


class OcrExtractorTests(unittest.TestCase):
    def test_create_easyocr_reader_disables_verbose_progress_output(self) -> None:
        calls: list[dict[str, object]] = []

        class FakeEasyOcrModule(types.SimpleNamespace):
            def Reader(self, languages: list[str], **kwargs: object) -> object:
                calls.append({"languages": languages, **kwargs})
                return object()

        with patch.dict(sys.modules, {"easyocr": FakeEasyOcrModule()}):
            create_easyocr_reader()

        self.assertEqual(calls, [{"languages": ["ja", "en"], "gpu": False, "verbose": False}])

    def test_extract_text_from_frames_adds_frame_dimensions_when_image_size_is_readable(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            frame_path = Path(tmp_dir) / "frame_001.png"
            frame_path.write_bytes(b"\x89PNG\r\n\x1a\n" + b"\x00\x00\x00\rIHDR" + struct.pack(">II", 720, 1280))
            reader = FakeReader(
                {
                    str(frame_path): [
                        ([[255, 420], [345, 420], [345, 448], [255, 448]], "Mail", 0.9),
                    ]
                }
            )

            results = extract_text_from_frames([ExtractedFrame(frame=1, path=str(frame_path))], reader=reader)

            self.assertEqual(results[0].as_dict()["frameWidth"], 720)
            self.assertEqual(results[0].as_dict()["frameHeight"], 1280)

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
                [
                    {
                        "rawText": "Mail",
                        "confidence": 0.81,
                        "frame": 3,
                        "boundingBox": {
                            "x": 0,
                            "y": 0,
                            "width": 1,
                            "height": 1,
                        },
                    }
                ],
            )
            self.assertEqual(reader.images, [str(frame_path)])

    def test_extract_text_from_frames_keeps_page_and_crop_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            frame_path = Path(tmp_dir) / "frame_010.jpg"
            frame_path.write_bytes(b"image")
            reader = FakeReader(
                {
                    str(frame_path): [
                        ([[10, 20], [40, 20], [40, 32], [10, 32]], "Calendar", 0.9),
                    ]
                }
            )

            results = extract_text_from_frames(
                [ExtractedFrame(frame=10, path=str(frame_path), page=4, page_frame_count=3)],
                reader=reader,
            )

            self.assertEqual(
                [result.as_dict() for result in results],
                [
                    {
                        "rawText": "Calendar",
                        "confidence": 0.9,
                        "frame": 10,
                        "page": 4,
                        "pageFrameCount": 3,
                        "boundingBox": {
                            "x": 10,
                            "y": 20,
                            "width": 30,
                            "height": 12,
                        },
                    }
                ],
            )

    def test_extract_text_from_frames_fails_when_frame_file_is_missing(self) -> None:
        reader = FakeReader({})

        with self.assertRaisesRegex(OcrExtractionError, "OCR 対象フレームが見つかりません"):
            extract_text_from_frames([ExtractedFrame(frame=1, path="missing.jpg")], reader=reader)


if __name__ == "__main__":
    unittest.main()
