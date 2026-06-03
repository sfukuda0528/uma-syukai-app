import argparse
import json
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

from frame_extraction.extractor import FrameExtractionError, extract_representative_frames
from matching.app_name_matcher import AppNameMatch, load_app_name_dictionary, match_app_names
from ocr.extractor import OcrExtractionError, extract_text_from_frames


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def get_job_path(job_id: str) -> Path:
    return Path.cwd() / "artifacts" / "jobs" / f"{job_id}.json"


def update_job(job_id: str, **patch: object) -> None:
    job_path = get_job_path(job_id)
    job = json.loads(job_path.read_text(encoding="utf-8"))
    job.update(patch)
    job["updatedAt"] = now_iso()
    job_path.write_text(json.dumps(job, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def read_job(job_id: str) -> dict[str, object]:
    job_path = get_job_path(job_id)
    return json.loads(job_path.read_text(encoding="utf-8"))


def build_pending_candidates(matches: Iterable[AppNameMatch]) -> list[dict[str, object]]:
    candidates: list[dict[str, object]] = []
    used_ids: set[str] = set()

    for match in matches:
        candidate = match.as_dict()
        candidate["id"] = _create_candidate_id(match.raw_text, used_ids)
        candidate["frame"] = match.frame or 0
        candidate["confirmed"] = False
        candidate["status"] = "pending"
        candidates.append(candidate)

    return candidates


def run_analysis(job_id: str) -> None:
    job = read_job(job_id)
    upload_path = Path.cwd() / str(job["uploadPath"])
    frames_dir = Path.cwd() / "tmp" / job_id / "frames"
    dictionary_path = Path.cwd() / "data" / "app-name-dictionary.json"

    update_job(job_id, status="extracting_frames")
    trim = job.get("trim")
    trim_start_seconds = None
    trim_end_seconds = None
    if isinstance(trim, dict):
        start_value = trim.get("startSeconds")
        end_value = trim.get("endSeconds")
        if isinstance(start_value, (int, float)):
            trim_start_seconds = float(start_value)
        if isinstance(end_value, (int, float)):
            trim_end_seconds = float(end_value)

    frames = extract_representative_frames(
        video_path=upload_path,
        output_dir=frames_dir,
        trim_start_seconds=trim_start_seconds,
        trim_end_seconds=trim_end_seconds,
    )

    update_job(
        job_id,
        status="running_ocr",
        frames=[frame.as_dict() for frame in frames],
    )
    raw_texts = [_ocr_result_as_dict(result) for result in extract_text_from_frames(frames)]
    dictionary = load_app_name_dictionary(dictionary_path)
    matches = match_app_names(raw_texts, dictionary)
    update_job(job_id, status="ready", candidates=build_pending_candidates(matches))


def _create_candidate_id(raw_text: str, used_ids: set[str]) -> str:
    base = _slugify(raw_text) or "candidate"
    candidate_id = f"ocr_{base}"
    index = 2

    while candidate_id in used_ids:
        candidate_id = f"ocr_{base}_{index}"
        index += 1

    used_ids.add(candidate_id)
    return candidate_id


def _ocr_result_as_dict(result: Any) -> dict[str, object]:
    if isinstance(result, dict):
        return result

    return result.as_dict()


def _slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).lower()
    characters: list[str] = []
    previous_was_separator = False

    for character in normalized:
        if character.isascii() and character.isalnum():
            characters.append(character)
            previous_was_separator = False
        elif not previous_was_separator:
            characters.append("-")
            previous_was_separator = True

    return "".join(characters).strip("-")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Home Icon Studio analysis worker.")
    parser.add_argument("--job-id", required=True)
    args = parser.parse_args()

    try:
        run_analysis(args.job_id)
    except (FrameExtractionError, OcrExtractionError, OSError, KeyError, ValueError, json.JSONDecodeError) as error:
        update_job(args.job_id, status="failed", errorMessage=str(error))


if __name__ == "__main__":
    main()
