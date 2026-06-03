import unittest

from worker.frame_extraction.extractor import ExtractedFrame
from worker.ocr.compare_engines import compare_ocr_engines
from worker.ocr.extractor import OcrText


class OcrComparisonTests(unittest.TestCase):
    def test_compare_ocr_engines_summarizes_each_engine(self) -> None:
        frames = [ExtractedFrame(frame=1, path="frame.jpg")]

        report = compare_ocr_engines(
            frames,
            engines={
                "easyocr": lambda _frames: [
                    OcrText(raw_text="Mail", confidence=0.95, frame=1),
                    OcrText(raw_text="Mail", confidence=0.75, frame=1),
                ],
                "paddleocr": lambda _frames: [
                    OcrText(raw_text="Calendar", confidence=0.6, frame=1),
                ],
            },
        )

        self.assertEqual(report["frameCount"], 1)
        self.assertEqual(report["engines"]["easyocr"]["rawCount"], 2)
        self.assertEqual(report["engines"]["easyocr"]["uniqueTexts"], ["Mail"])
        self.assertEqual(report["engines"]["easyocr"]["averageConfidence"], 0.85)
        self.assertEqual(report["engines"]["paddleocr"]["rawCount"], 1)

    def test_compare_ocr_engines_records_engine_failures(self) -> None:
        report = compare_ocr_engines(
            [ExtractedFrame(frame=1, path="frame.jpg")],
            engines={"broken": lambda _frames: (_ for _ in ()).throw(RuntimeError("boom"))},
        )

        self.assertEqual(report["engines"]["broken"]["error"], "boom")
        self.assertEqual(report["engines"]["broken"]["rawCount"], 0)


if __name__ == "__main__":
    unittest.main()
