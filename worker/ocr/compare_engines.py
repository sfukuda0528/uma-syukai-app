from collections.abc import Callable
from typing import Any

from frame_extraction.extractor import ExtractedFrame
from ocr.extractor import OcrText, extract_text_from_frames


EngineRunner = Callable[[list[ExtractedFrame]], list[OcrText]]


def compare_ocr_engines(
    frames: list[ExtractedFrame],
    *,
    engines: dict[str, EngineRunner] | None = None,
) -> dict[str, Any]:
    runners = engines or {"easyocr": extract_text_from_frames}
    report: dict[str, Any] = {
        "frameCount": len(frames),
        "engines": {},
    }

    for name, runner in runners.items():
        try:
            results = runner(frames)
            report["engines"][name] = _summarize_results(results)
        except Exception as error:  # noqa: BLE001 - comparison reports engine failures side-by-side.
            report["engines"][name] = {
                "averageConfidence": 0,
                "error": str(error),
                "rawCount": 0,
                "uniqueTexts": [],
            }

    return report


def _summarize_results(results: list[OcrText]) -> dict[str, Any]:
    unique_texts = sorted({result.raw_text for result in results})
    average = 0
    if results:
        average = round(sum(result.confidence for result in results) / len(results), 2)

    return {
        "averageConfidence": average,
        "rawCount": len(results),
        "uniqueTexts": unique_texts,
    }
