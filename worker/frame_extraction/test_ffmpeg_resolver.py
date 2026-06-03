import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from worker.frame_extraction.extractor import get_ffmpeg_candidates, resolve_ffmpeg_executable


class FfmpegResolverTests(unittest.TestCase):
    def test_get_ffmpeg_candidates_includes_winget_package_path(self) -> None:
        candidates = get_ffmpeg_candidates(
            {
                "LOCALAPPDATA": "C:\\Users\\kyome\\AppData\\Local",
                "PATH": "",
            }
        )

        self.assertIn(
            "C:\\Users\\kyome\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.1-full_build\\bin\\ffmpeg.exe",
            candidates,
        )

    def test_resolve_ffmpeg_executable_returns_first_existing_absolute_candidate(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            ffmpeg_path = Path(tmp_dir) / "ffmpeg.exe"
            ffmpeg_path.write_text("", encoding="utf-8")

            self.assertEqual(
                resolve_ffmpeg_executable([str(ffmpeg_path), "ffmpeg"]),
                str(ffmpeg_path),
            )

    def test_resolve_ffmpeg_executable_falls_back_to_command_name(self) -> None:
        with patch.dict(os.environ, {"PATH": ""}, clear=False):
            self.assertEqual(resolve_ffmpeg_executable(["ffmpeg"]), "ffmpeg")


if __name__ == "__main__":
    unittest.main()
