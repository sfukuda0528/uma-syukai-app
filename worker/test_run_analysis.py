import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from worker.frame_extraction.extractor import ExtractedFrame
from worker.matching.app_name_matcher import AppNameMatch
from worker.run_analysis import build_pending_candidates, configure_text_streams


class FakeTextStream:
    def __init__(self) -> None:
        self.reconfigure_kwargs: dict[str, str] | None = None

    def reconfigure(self, **kwargs: str) -> None:
        self.reconfigure_kwargs = kwargs


class RunAnalysisTests(unittest.TestCase):
    def test_configure_text_streams_uses_utf8_with_replacement_errors(self) -> None:
        fake_stdout = FakeTextStream()
        fake_stderr = FakeTextStream()

        with patch("worker.run_analysis.sys.stdout", fake_stdout), patch("worker.run_analysis.sys.stderr", fake_stderr):
            configure_text_streams()

        self.assertEqual(fake_stdout.reconfigure_kwargs, {"encoding": "utf-8", "errors": "replace"})
        self.assertEqual(fake_stderr.reconfigure_kwargs, {"encoding": "utf-8", "errors": "replace"})

    def test_build_pending_candidates_serializes_matches_for_review(self) -> None:
        matches = [
            AppNameMatch(
                raw_text="Mail",
                display_name="メール",
                confidence=0.76,
                match_reason="exact",
                matched_alias="Mail",
                frame=2,
            )
        ]

        candidates = build_pending_candidates(matches)

        self.assertEqual(
            candidates,
            [
                {
                    "id": "ocr_mail",
                    "rawText": "Mail",
                    "displayName": "メール",
                    "confidence": 0.76,
                    "frame": 2,
                    "confirmed": False,
                    "status": "pending",
                    "matchReason": "exact",
                    "matchedAlias": "Mail",
                }
            ],
        )

    def test_build_pending_candidates_keeps_ids_unique_for_duplicate_raw_text(self) -> None:
        matches = [
            AppNameMatch("Mail", "メール", 0.76, "exact", "Mail", frame=1),
            AppNameMatch("Mail", "Mail Backup", 0.7, "exact", "Mail", frame=2),
        ]

        candidates = build_pending_candidates(matches)

        self.assertEqual([candidate["id"] for candidate in candidates], ["ocr_mail", "ocr_mail_2"])

    @patch("worker.run_analysis.extract_text_from_frames")
    @patch("worker.run_analysis.extract_representative_frames")
    def test_run_analysis_connects_ocr_and_dictionary_matching(
        self,
        fake_extract_frames,
        fake_extract_text,
    ) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir)
            jobs_dir = root / "artifacts" / "jobs"
            upload_dir = root / "uploads"
            jobs_dir.mkdir(parents=True)
            upload_dir.mkdir()
            upload_path = upload_dir / "recording.mp4"
            upload_path.write_bytes(b"video")
            job_path = jobs_dir / "job-1.json"
            job_path.write_text(
                (
                    '{"id":"job-1","status":"queued","uploadPath":"uploads/recording.mp4",'
                    '"uploadFileName":"recording.mp4","originalFileName":"recording.mp4",'
                    '"fileSize":5,"mimeType":"video/mp4","createdAt":"2026-06-03T00:00:00Z",'
                    '"updatedAt":"2026-06-03T00:00:00Z","candidates":[],'
                    '"analysisSettings":{"everySeconds":3,"maxFrames":24,"minConfidence":0.8}}'
                ),
                encoding="utf-8",
            )
            (root / "data").mkdir()
            (root / "data" / "app-name-dictionary.json").write_text(
                '[{"canonicalName":"メール","aliases":["Mail","メール"]},'
                '{"canonicalName":"メモ","aliases":["Memo","メモ"]}]',
                encoding="utf-8",
            )
            frame = ExtractedFrame(frame=1, path=str(root / "tmp" / "job-1" / "frames" / "frame_001.jpg"))
            fake_extract_frames.return_value = [frame]
            fake_extract_text.return_value = [
                {"rawText": "Mail", "confidence": 0.9, "frame": 1},
                {"rawText": "Memo", "confidence": 0.5, "frame": 1},
            ]

            with patch("worker.run_analysis.Path.cwd", return_value=root):
                from worker.run_analysis import run_analysis

                run_analysis("job-1")

            job = job_path.read_text(encoding="utf-8")
            fake_extract_frames.assert_called_once()
            self.assertEqual(fake_extract_frames.call_args.kwargs["every_seconds"], 3)
            self.assertEqual(fake_extract_frames.call_args.kwargs["max_frames"], 24)
            self.assertIn('"status": "ready"', job)
            self.assertIn('"displayName": "メール"', job)
            self.assertNotIn('"displayName": "メモ"', job)
            self.assertIn('"status": "pending"', job)

    @patch("worker.run_analysis.extract_text_from_frames")
    @patch("worker.run_analysis.extract_representative_frames")
    def test_run_analysis_deletes_upload_after_success_when_requested(
        self,
        fake_extract_frames,
        fake_extract_text,
    ) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            root = Path(tmp_dir)
            jobs_dir = root / "artifacts" / "jobs"
            upload_dir = root / "uploads"
            jobs_dir.mkdir(parents=True)
            upload_dir.mkdir()
            upload_path = upload_dir / "recording.mp4"
            upload_path.write_bytes(b"video")
            job_path = jobs_dir / "job-1.json"
            job_path.write_text(
                (
                    '{"id":"job-1","status":"queued","uploadPath":"uploads/recording.mp4",'
                    '"uploadFileName":"recording.mp4","originalFileName":"recording.mp4",'
                    '"fileSize":5,"mimeType":"video/mp4","createdAt":"2026-06-03T00:00:00Z",'
                    '"updatedAt":"2026-06-03T00:00:00Z","candidates":[],"deleteUploadAfterAnalysis":true}'
                ),
                encoding="utf-8",
            )
            (root / "data").mkdir()
            (root / "data" / "app-name-dictionary.json").write_text(
                '[{"canonicalName":"メール","aliases":["Mail","メール"]}]',
                encoding="utf-8",
            )
            fake_extract_frames.return_value = [
                ExtractedFrame(frame=1, path=str(root / "tmp" / "job-1" / "frames" / "frame_001.jpg"))
            ]
            fake_extract_text.return_value = [{"rawText": "Mail", "confidence": 0.9, "frame": 1}]

            with patch("worker.run_analysis.Path.cwd", return_value=root):
                from worker.run_analysis import run_analysis

                run_analysis("job-1")

            job = json.loads(job_path.read_text(encoding="utf-8"))
            self.assertFalse(upload_path.exists())
            self.assertIn("uploadDeletedAt", job)


if __name__ == "__main__":
    unittest.main()
