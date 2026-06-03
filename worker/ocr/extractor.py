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
    page: int | None = None
    page_frame_count: int | None = None
    bounding_box: dict[str, int] | None = None
    frame_width: int | None = None
    frame_height: int | None = None

    def as_dict(self) -> dict[str, object]:
        result: dict[str, object] = {
            "rawText": self.raw_text,
            "confidence": self.confidence,
            "frame": self.frame,
        }

        if self.page is not None:
            result["page"] = self.page
        if self.page_frame_count is not None:
            result["pageFrameCount"] = self.page_frame_count
        if self.bounding_box is not None:
            result["boundingBox"] = self.bounding_box
        if self.frame_width is not None:
            result["frameWidth"] = self.frame_width
        if self.frame_height is not None:
            result["frameHeight"] = self.frame_height

        return result


class OcrExtractionError(RuntimeError):
    pass


def create_easyocr_reader() -> OcrReader:
    try:
        import easyocr
    except ImportError as error:
        raise OcrExtractionError(
            "easyocr が見つかりません。worker/requirements.txt の依存関係をインストールしてください。"
        ) from error

    return easyocr.Reader(["ja", "en"], gpu=False, verbose=False)


def extract_text_from_frames(frames: list[ExtractedFrame], *, reader: OcrReader | None = None) -> list[OcrText]:
    if not frames:
        return []

    ocr_reader = reader or create_easyocr_reader()
    results: list[OcrText] = []

    for frame in frames:
        frame_path = Path(frame.path)
        if not frame_path.exists():
            raise OcrExtractionError(f"OCR 対象フレームが見つかりません: {frame.path}")

        frame_size = _read_image_size(frame_path)
        for raw_result in ocr_reader.readtext(str(frame_path), detail=1, paragraph=False):
            parsed = _parse_easyocr_result(raw_result, frame, frame_size=frame_size)
            if parsed is not None:
                results.append(parsed)

    return results


def _parse_easyocr_result(raw_result: Any, frame: ExtractedFrame, *, frame_size: tuple[int, int] | None) -> OcrText | None:
    if not isinstance(raw_result, (list, tuple)) or len(raw_result) < 2:
        return None

    raw_text = raw_result[1]
    if not isinstance(raw_text, str) or not raw_text.strip():
        return None

    confidence = 1.0
    if len(raw_result) >= 3 and isinstance(raw_result[2], (int, float)):
        confidence = max(0.0, min(1.0, float(raw_result[2])))

    return OcrText(
        raw_text=raw_text.strip(),
        confidence=round(confidence, 2),
        frame=frame.frame,
        page=frame.page,
        page_frame_count=frame.page_frame_count,
        bounding_box=_read_bounding_box(raw_result[0]),
        frame_width=frame_size[0] if frame_size is not None else None,
        frame_height=frame_size[1] if frame_size is not None else None,
    )


def _read_image_size(path: Path) -> tuple[int, int] | None:
    data = path.read_bytes()

    if data.startswith(b"\x89PNG\r\n\x1a\n") and len(data) >= 24:
        return int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big")

    if data.startswith(b"\xff\xd8"):
        index = 2
        while index + 9 < len(data):
            if data[index] != 0xFF:
                index += 1
                continue
            marker = data[index + 1]
            index += 2
            if marker in (0xD8, 0xD9):
                continue
            if index + 2 > len(data):
                return None
            segment_length = int.from_bytes(data[index : index + 2], "big")
            if marker in range(0xC0, 0xC4) and index + 7 < len(data):
                height = int.from_bytes(data[index + 3 : index + 5], "big")
                width = int.from_bytes(data[index + 5 : index + 7], "big")
                return width, height
            index += segment_length

    return None


def _read_bounding_box(value: Any) -> dict[str, int] | None:
    if not isinstance(value, (list, tuple)):
        return None

    points: list[tuple[float, float]] = []
    for point in value:
        if not isinstance(point, (list, tuple)) or len(point) < 2:
            return None
        x, y = point[0], point[1]
        if not isinstance(x, (int, float)) or not isinstance(y, (int, float)):
            return None
        points.append((float(x), float(y)))

    if not points:
        return None

    min_x = min(point[0] for point in points)
    max_x = max(point[0] for point in points)
    min_y = min(point[1] for point in points)
    max_y = max(point[1] for point in points)

    return {
        "x": round(min_x),
        "y": round(min_y),
        "width": round(max_x - min_x),
        "height": round(max_y - min_y),
    }
