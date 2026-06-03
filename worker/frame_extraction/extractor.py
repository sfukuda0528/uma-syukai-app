import subprocess
from dataclasses import dataclass
import os
from pathlib import Path
from typing import Callable


class FrameExtractionError(RuntimeError):
    pass


@dataclass(frozen=True)
class ExtractedFrame:
    frame: int
    path: str

    def as_dict(self) -> dict[str, object]:
        return {
            "frame": self.frame,
            "path": self.path,
        }


CommandRunner = Callable[[list[str]], None]


def get_ffmpeg_candidates(env: dict[str, str] | os._Environ[str] = os.environ) -> list[str]:
    candidates: list[str] = []
    local_app_data = env.get("LOCALAPPDATA")

    if local_app_data:
        winget_root = Path(local_app_data) / "Microsoft" / "WinGet" / "Packages"
        candidates.append(
            str(
                winget_root
                / "Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe"
                / "ffmpeg-8.1.1-full_build"
                / "bin"
                / "ffmpeg.exe"
            )
        )

    candidates.append("ffmpeg")

    return candidates


def resolve_ffmpeg_executable(candidates: list[str] | None = None) -> str:
    for candidate in candidates or get_ffmpeg_candidates():
        if "\\" not in candidate and "/" not in candidate:
            return candidate

        if Path(candidate).exists():
            return candidate

    return "ffmpeg"


def run_ffmpeg(command: list[str]) -> None:
    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
    except FileNotFoundError as error:
        raise FrameExtractionError("ffmpeg が見つかりません。ffmpeg をインストールして PATH に追加してください。") from error
    except subprocess.CalledProcessError as error:
        message = error.stderr.strip() or error.stdout.strip() or "ffmpeg の実行に失敗しました。"
        raise FrameExtractionError(message) from error


def extract_representative_frames(
    *,
    video_path: Path,
    output_dir: Path,
    every_seconds: int = 2,
    max_frames: int = 12,
    trim_start_seconds: float | None = None,
    trim_end_seconds: float | None = None,
    run_command: CommandRunner = run_ffmpeg,
) -> list[ExtractedFrame]:
    output_dir.mkdir(parents=True, exist_ok=True)
    output_pattern = output_dir / "frame_%03d.jpg"

    command = [
        resolve_ffmpeg_executable(),
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
    ]

    if trim_start_seconds is not None and trim_start_seconds > 0:
        command.extend(["-ss", _format_seconds(trim_start_seconds)])

    if trim_end_seconds is not None and trim_end_seconds > 0:
        command.extend(["-to", _format_seconds(trim_end_seconds)])

    command.extend(
        [
        "-i",
        str(video_path),
        "-vf",
        f"fps=1/{every_seconds},scale=720:-1",
        "-frames:v",
        str(max_frames),
        "-q:v",
        "3",
        str(output_pattern),
        ]
    )

    run_command(command)

    frame_paths = sorted(output_dir.glob("frame_*.jpg"))

    if not frame_paths:
        raise FrameExtractionError("代表フレームを抽出できませんでした。動画が短すぎるか、壊れている可能性があります。")

    return [
        ExtractedFrame(frame=index + 1, path=str(frame_path))
        for index, frame_path in enumerate(frame_paths)
    ]


def _format_seconds(value: float) -> str:
    return f"{value:.2f}".rstrip("0").rstrip(".")
