from dataclasses import dataclass
from pathlib import Path
from typing import Any, Protocol

from frame_extraction.extractor import ExtractedFrame


class OcrReader(Protocol):
    def readtext(self, image: str, detail: int = 1, paragraph: bool = False) -> list[Any]:
        ...


@dataclass(frozen=True)
class OcrText:
    raw_text: str
    confidence: float
    frame: int

    def as_dict(self) -> dict[str, object]:
        return {
            "rawText": self.raw_text,
            "confidence": self.confidence,
            "frame": self.frame,
        }


class OcrExtractionError(RuntimeError):
    pass


def create_easyocr_reader() -> OcrReader:
    try:
        import easyocr
    except ImportError as error:
        raise OcrExtractionError(
            "easyocr が見つかりません。worker/requirements.txt の依存関係をインストールしてください。"
        ) from error

    return easyocr.Reader(["ja", "en"], gpu=False)


def extract_text_from_frames(frames: list[ExtractedFrame], *, reader: OcrReader | None = None) -> list[OcrText]:
    if not frames:
        return []

    ocr_reader = reader or create_easyocr_reader()
    results: list[OcrText] = []

    for frame in frames:
        frame_path = Path(frame.path)
        if not frame_path.exists():
            raise OcrExtractionError(f"OCR 対象フレームが見つかりません: {frame.path}")

        for raw_result in ocr_reader.readtext(str(frame_path), detail=1, paragraph=False):
            parsed = _parse_easyocr_result(raw_result, frame.frame)
            if parsed is not None:
                results.append(parsed)

    return results


def _parse_easyocr_result(raw_result: Any, frame: int) -> OcrText | None:
    if not isinstance(raw_result, (list, tuple)) or len(raw_result) < 2:
        return None

    raw_text = raw_result[1]
    if not isinstance(raw_text, str) or not raw_text.strip():
        return None

    confidence = 1.0
    if len(raw_result) >= 3 and isinstance(raw_result[2], (int, float)):
        confidence = max(0.0, min(1.0, float(raw_result[2])))

    return OcrText(raw_text=raw_text.strip(), confidence=round(confidence, 2), frame=frame)
