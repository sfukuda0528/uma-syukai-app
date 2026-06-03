import json
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

from layout.grid_position import estimate_grid_position


@dataclass(frozen=True)
class AppNameEntry:
    canonical_name: str
    aliases: tuple[str, ...]


@dataclass(frozen=True)
class AppNameMatch:
    raw_text: str
    display_name: str
    confidence: float
    match_reason: str
    matched_alias: str
    frame: int | None = None
    page: int | None = None
    page_frame_count: int | None = None
    bounding_box: dict[str, int] | None = None
    home_position: dict[str, object] | None = None
    frame_width: int | None = None
    frame_height: int | None = None

    def as_dict(self) -> dict[str, object]:
        result: dict[str, object] = {
            "rawText": self.raw_text,
            "displayName": self.display_name,
            "confidence": self.confidence,
            "matchReason": self.match_reason,
            "matchedAlias": self.matched_alias,
        }

        if self.frame is not None:
            result["frame"] = self.frame
        if self.page is not None:
            result["page"] = self.page
        if self.page_frame_count is not None:
            result["pageFrameCount"] = self.page_frame_count
        if self.bounding_box is not None:
            result["boundingBox"] = self.bounding_box
        if self.home_position is not None:
            result["homePosition"] = self.home_position
        if self.frame_width is not None:
            result["frameWidth"] = self.frame_width
        if self.frame_height is not None:
            result["frameHeight"] = self.frame_height

        return result


def normalize_app_name(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value).casefold()
    return "".join(character for character in normalized if character.isalnum())


def load_app_name_dictionary(path: Path) -> list[AppNameEntry]:
    raw_entries = json.loads(path.read_text(encoding="utf-8"))

    if not isinstance(raw_entries, list):
        raise ValueError("アプリ名辞書は配列である必要があります。")

    entries: list[AppNameEntry] = []
    for index, raw_entry in enumerate(raw_entries):
        if not isinstance(raw_entry, dict):
            raise ValueError(f"辞書エントリ {index} はオブジェクトである必要があります。")

        canonical_name = raw_entry.get("canonicalName")
        aliases = raw_entry.get("aliases")

        if not isinstance(canonical_name, str) or not canonical_name.strip():
            raise ValueError(f"辞書エントリ {index} の canonicalName が不正です。")
        if not isinstance(aliases, list) or not aliases:
            raise ValueError(f"辞書エントリ {index} の aliases が不正です。")
        if any(not isinstance(alias, str) or not alias.strip() for alias in aliases):
            raise ValueError(f"辞書エントリ {index} の aliases が不正です。")

        all_aliases = tuple(dict.fromkeys([canonical_name, *aliases]))
        entries.append(AppNameEntry(canonical_name=canonical_name, aliases=all_aliases))

    return entries


def match_app_name(
    raw_text: str,
    dictionary: Iterable[AppNameEntry],
    *,
    ocr_confidence: float = 1.0,
    frame: int | None = None,
    page: int | None = None,
    page_frame_count: int | None = None,
    bounding_box: dict[str, int] | None = None,
    home_position: dict[str, object] | None = None,
    frame_width: int | None = None,
    frame_height: int | None = None,
) -> AppNameMatch | None:
    normalized_raw = normalize_app_name(raw_text)

    if not normalized_raw:
        return None

    best_match: AppNameMatch | None = None

    for entry in dictionary:
        for alias in entry.aliases:
            normalized_alias = normalize_app_name(alias)
            if not normalized_alias:
                continue

            match_reason: str | None = None
            base_confidence = 0.0

            if raw_text == alias:
                match_reason = "exact"
                base_confidence = 0.95
            elif normalized_raw == normalized_alias:
                match_reason = "normalized"
                base_confidence = 0.90
            elif _is_partial_match(normalized_raw, normalized_alias):
                match_reason = "partial"
                base_confidence = 0.72

            if match_reason is None:
                continue

            confidence = round(max(0.0, min(1.0, base_confidence * ocr_confidence)), 2)
            current_match = AppNameMatch(
                raw_text=raw_text,
                display_name=entry.canonical_name,
                confidence=confidence,
                match_reason=match_reason,
                matched_alias=alias,
                frame=frame,
                page=page,
                page_frame_count=page_frame_count,
                bounding_box=bounding_box,
                home_position=home_position,
                frame_width=frame_width,
                frame_height=frame_height,
            )

            if best_match is None or current_match.confidence > best_match.confidence:
                best_match = current_match

    return best_match


def match_app_names(raw_items: Iterable[dict[str, Any]], dictionary: Iterable[AppNameEntry]) -> list[AppNameMatch]:
    entries = list(dictionary)
    best_by_display_name: dict[str, AppNameMatch] = {}

    for item in raw_items:
        raw_text = _read_text(item)
        if raw_text is None:
            continue

        confidence = _read_float(item.get("confidence"), default=1.0)
        frame = _read_int(item.get("frame"))
        page = _read_int(item.get("page"))
        page_frame_count = _read_int(item.get("pageFrameCount"))
        bounding_box = _read_bounding_box(item.get("boundingBox"))
        frame_width = _read_int(item.get("frameWidth"))
        frame_height = _read_int(item.get("frameHeight"))
        home_position = estimate_grid_position(
            bounding_box=bounding_box,
            frame_width=frame_width,
            frame_height=frame_height,
        )
        match = match_app_name(
            raw_text,
            entries,
            ocr_confidence=confidence,
            frame=frame,
            page=page,
            page_frame_count=page_frame_count,
            bounding_box=bounding_box,
            home_position=home_position,
            frame_width=frame_width,
            frame_height=frame_height,
        )

        if match is None:
            continue

        previous = best_by_display_name.get(match.display_name)
        if previous is None or match.confidence > previous.confidence:
            best_by_display_name[match.display_name] = match

    return sorted(best_by_display_name.values(), key=lambda match: match.confidence, reverse=True)


def _is_partial_match(raw: str, alias: str) -> bool:
    if len(raw) < 2 or len(alias) < 2:
        return False

    return raw in alias or alias in raw


def _read_text(item: dict[str, Any]) -> str | None:
    raw_text = item.get("rawText", item.get("text"))

    if isinstance(raw_text, str) and raw_text.strip():
        return raw_text

    return None


def _read_float(value: Any, *, default: float) -> float:
    if isinstance(value, (int, float)):
        return max(0.0, min(1.0, float(value)))

    return default


def _read_int(value: Any) -> int | None:
    if isinstance(value, int):
        return value

    return None


def _read_bounding_box(value: Any) -> dict[str, int] | None:
    if not isinstance(value, dict):
        return None

    result: dict[str, int] = {}
    for key in ("x", "y", "width", "height"):
        item = value.get(key)
        if not isinstance(item, int):
            return None
        result[key] = item

    return result
