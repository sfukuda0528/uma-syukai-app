import tempfile
import unittest
from pathlib import Path

from worker.frame_extraction.extractor import FrameExtractionError, extract_representative_frames


class FrameExtractionTests(unittest.TestCase):
    def test_extract_representative_frames_returns_frame_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            video_path = tmp_path / "recording.mp4"
            output_dir = tmp_path / "frames"
            video_path.write_bytes(b"fake video")

            def fake_run(command: list[str]) -> None:
                self.assertEqual(command[0], "ffmpeg")
                self.assertIn(str(video_path), command)
                output_dir.mkdir(parents=True, exist_ok=True)
                (output_dir / "frame_001.jpg").write_bytes(b"frame")
                (output_dir / "frame_002.jpg").write_bytes(b"frame")

            frames = extract_representative_frames(
                video_path=video_path,
                output_dir=output_dir,
                every_seconds=2,
                max_frames=2,
                run_command=fake_run,
            )

            self.assertEqual(
                [frame.as_dict() for frame in frames],
                [
                    {"frame": 1, "path": str(output_dir / "frame_001.jpg")},
                    {"frame": 2, "path": str(output_dir / "frame_002.jpg")},
                ],
            )

    def test_extract_representative_frames_applies_trim_range(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            video_path = tmp_path / "recording.mp4"
            output_dir = tmp_path / "frames"
            video_path.write_bytes(b"fake video")
            captured_command: list[str] = []

            def fake_run(command: list[str]) -> None:
                captured_command.extend(command)
                output_dir.mkdir(parents=True, exist_ok=True)
                (output_dir / "frame_001.jpg").write_bytes(b"frame")

            extract_representative_frames(
                video_path=video_path,
                output_dir=output_dir,
                trim_start_seconds=3.5,
                trim_end_seconds=12.25,
                run_command=fake_run,
            )

            self.assertIn("-ss", captured_command)
            self.assertIn("3.5", captured_command)
            self.assertIn("-to", captured_command)
            self.assertIn("12.25", captured_command)

    def test_extract_representative_frames_fails_when_no_frames_are_written(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            tmp_path = Path(tmp_dir)
            video_path = tmp_path / "broken.mp4"
            output_dir = tmp_path / "frames"
            video_path.write_bytes(b"not a real movie")

            with self.assertRaisesRegex(FrameExtractionError, "代表フレームを抽出できませんでした。"):
                extract_representative_frames(
                    video_path=video_path,
                    output_dir=output_dir,
                    run_command=lambda _command: None,
                )


if __name__ == "__main__":
    unittest.main()
