"use client";

import { useEffect, useMemo, useState } from "react";
import { BellOff, MonitorPause, Play, Scissors, ShieldCheck, Trash2, Upload } from "lucide-react";

type UploadPanelProps = {
  errorMessage?: string;
  file?: File | null;
  fileName?: string;
  isStarting: boolean;
  onFileChange: (file: File | null) => void;
  onRetentionChange?: (deleteUploadAfterAnalysis: boolean) => void;
  onStart: () => void;
  onTrimChange?: (trim: { endSeconds?: number; startSeconds?: number }) => void;
};

export function UploadPanel({
  errorMessage,
  file,
  fileName,
  isStarting,
  onFileChange,
  onRetentionChange,
  onStart,
  onTrimChange
}: UploadPanelProps) {
  const [duration, setDuration] = useState(0);
  const [deleteUploadAfterAnalysis, setDeleteUploadAfterAnalysis] = useState(true);
  const [startSeconds, setStartSeconds] = useState(0);
  const [endSeconds, setEndSeconds] = useState(0);
  const videoUrl = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file]);

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  useEffect(() => {
    onRetentionChange?.(deleteUploadAfterAnalysis);
  }, [deleteUploadAfterAnalysis, onRetentionChange]);

  useEffect(() => {
    onTrimChange?.({
      endSeconds: endSeconds > 0 ? endSeconds : undefined,
      startSeconds: startSeconds > 0 ? startSeconds : undefined
    });
  }, [endSeconds, onTrimChange, startSeconds]);

  function updateDuration(value: number) {
    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    const rounded = Math.round(value * 10) / 10;
    setDuration(rounded);
    setEndSeconds(rounded);
  }

  return (
    <div className="self-start rounded-md border border-ink/10 bg-white p-4 shadow-panel sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black leading-tight">録画アップロード</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            まずはホーム画面録画を選択します。解析結果は推定として扱い、最終確認はユーザーが行います。
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-tomato text-white">
          <Upload className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-md border border-ink/10 bg-paper/70 p-3">
        <div className="flex items-center gap-2 text-sm font-black">
          <MonitorPause className="h-4 w-4 text-moss" aria-hidden="true" />
          録画前チェック
        </div>
        <div className="grid gap-2 text-sm leading-6 text-ink/70">
          <div className="flex gap-2">
            <BellOff className="mt-1 h-4 w-4 shrink-0 text-tomato" aria-hidden="true" />
            <span>通知・壁紙・ウィジェットなど、映したくないものを避けてから録画します。</span>
          </div>
          <div className="flex gap-2">
            <MonitorPause className="mt-1 h-4 w-4 shrink-0 text-tomato" aria-hidden="true" />
            <span>各ページで少し停止すると、アプリ名候補を拾いやすくなります。</span>
          </div>
          <div className="flex gap-2">
            <Scissors className="mt-1 h-4 w-4 shrink-0 text-tomato" aria-hidden="true" />
            <span>不要な前後の範囲は、アップロード前に下のプレビューでトリミングできます。</span>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2 rounded-md border border-moss/20 bg-moss/5 p-3 text-sm leading-6 text-ink/72">
        <div className="flex gap-2">
          <ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-moss" aria-hidden="true" />
          <span>解析はこの端末のローカル処理として扱い、クラウド OCR はデフォルトで使いません。</span>
        </div>
        <div className="flex gap-2">
          <Trash2 className="mt-1 h-4 w-4 shrink-0 text-moss" aria-hidden="true" />
          <span>録画、解析結果、生成済みアイコンは、完了後にまとめて削除できます。</span>
        </div>
        <label className="mt-1 flex items-start gap-2 rounded-md border border-moss/15 bg-white px-3 py-2 font-bold">
          <input
            type="checkbox"
            checked={deleteUploadAfterAnalysis}
            onChange={(event) => setDeleteUploadAfterAnalysis(event.currentTarget.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-moss"
          />
          <span>解析が完了したらアップロード録画だけ削除する</span>
        </label>
      </div>

      <label className="mt-5 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-steel/45 bg-paper/65 px-5 text-center transition hover:border-tomato hover:bg-white sm:mt-6">
        <Upload className="h-8 w-8 text-steel" aria-hidden="true" />
        <span className="mt-3 text-sm font-bold">動画ファイルを選択</span>
        <span className="mt-1 max-w-full break-words text-xs text-ink/55">
          {fileName ?? "mp4 / mov / m4v"}
        </span>
        <input
          className="sr-only"
          type="file"
          accept="video/mp4,video/quicktime,video/x-m4v"
          onChange={(event) => onFileChange(event.currentTarget.files?.[0] ?? null)}
        />
      </label>

      {videoUrl && (
        <div className="mt-4 rounded-md border border-ink/10 bg-paper/75 p-3">
          <video
            src={videoUrl}
            controls
            preload="metadata"
            onLoadedMetadata={(event) => updateDuration(event.currentTarget.duration)}
            className="aspect-video w-full rounded-md bg-ink object-contain"
          />
          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-ink/60">
            <Scissors className="h-4 w-4 text-tomato" aria-hidden="true" />
            解析する範囲
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-xs font-bold text-ink/60">
              開始秒
              <input
                type="number"
                min={0}
                max={duration || undefined}
                step={0.1}
                value={startSeconds}
                onChange={(event) => setStartSeconds(Number(event.target.value))}
                className="h-10 rounded-md border border-ink/15 bg-white px-3 text-sm text-ink outline-none focus:border-tomato"
              />
            </label>
            <label className="grid gap-1 text-xs font-bold text-ink/60">
              終了秒
              <input
                type="number"
                min={0}
                max={duration || undefined}
                step={0.1}
                value={endSeconds}
                onChange={(event) => setEndSeconds(Number(event.target.value))}
                className="h-10 rounded-md border border-ink/15 bg-white px-3 text-sm text-ink outline-none focus:border-tomato"
              />
            </label>
          </div>
        </div>
      )}

      <button
        type="button"
        disabled={isStarting}
        onClick={onStart}
        className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-moss px-4 text-sm font-bold text-white transition hover:bg-ink"
      >
        <Play className="h-4 w-4" aria-hidden="true" />
        {isStarting ? "アップロード中" : "解析ジョブを開始"}
      </button>
      {errorMessage && (
        <p className="mt-3 rounded-md bg-tomato/10 px-3 py-2 text-sm font-bold leading-6 text-tomato">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
