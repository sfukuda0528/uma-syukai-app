import { CircleDashed, Cpu, FolderOpen, OctagonX, RotateCcw, SlidersHorizontal } from "lucide-react";
import type { AnalysisJob, AnalysisSettings, JobStatus } from "@/lib/jobs/types";

type StatusPanelProps = {
  job: AnalysisJob | null;
  isReanalyzing?: boolean;
  isCancelling?: boolean;
  onCancel?: () => void;
  settings?: AnalysisSettings;
  onReanalyze?: () => void;
  onSettingsChange?: (settings: AnalysisSettings) => void;
};

const statusLabels: Record<JobStatus, string> = {
  cancelled: "キャンセル済み",
  extracting_frames: "代表フレーム抽出中",
  failed: "失敗",
  queued: "待機中",
  ready: "完了",
  running_ocr: "OCR 実行中"
};

function getStepState(job: AnalysisJob | null, step: "upload" | "frames" | "ocr") {
  if (!job) {
    return "未開始";
  }

  if (job.status === "failed") {
    return "失敗";
  }
  if (job.status === "cancelled") {
    return "キャンセル";
  }

  if (step === "upload") {
    return "完了";
  }

  if (step === "frames") {
    return ["extracting_frames", "running_ocr", "ready"].includes(job.status) ? "処理中/完了" : "待機";
  }

  return ["running_ocr", "ready"].includes(job.status) ? "処理中/完了" : "待機";
}

const defaultSettings: AnalysisSettings = {
  everySeconds: 2,
  maxFrames: 12,
  minConfidence: 0.55
};

export function StatusPanel({
  job,
  isCancelling = false,
  isReanalyzing = false,
  onCancel,
  settings = defaultSettings,
  onReanalyze,
  onSettingsChange
}: StatusPanelProps) {
  const steps = [
    { label: "アップロード保存", state: getStepState(job, "upload") },
    { label: "代表フレーム抽出", state: getStepState(job, "frames") },
    { label: "OCR 候補生成", state: getStepState(job, "ocr") }
  ];
  const canCancel = job ? ["queued", "extracting_frames", "running_ocr"].includes(job.status) : false;
  const canReanalyze = Boolean(job && !job.uploadDeletedAt);

  return (
    <div className="rounded-md border border-ink/10 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">解析ステータス</h2>
          <p className="mt-1 text-sm text-ink/60">Next.js から Python ワーカーへ処理を渡します。</p>
        </div>
        <Cpu className="h-5 w-5 text-steel" aria-hidden="true" />
      </div>

      <div className="mt-5 grid gap-3">
        {steps.map((step) => (
          <div key={step.label} className="flex min-h-14 items-center justify-between rounded-md bg-paper px-3 py-3">
            <span className="inline-flex items-center gap-2 text-sm font-bold leading-tight">
              <CircleDashed className="h-4 w-4 text-tomato" aria-hidden="true" />
              {step.label}
            </span>
            <span className="text-xs text-ink/55">{step.state}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-ink/55">
        <FolderOpen className="h-4 w-4" aria-hidden="true" />
        {job ? `${statusLabels[job.status]}: ${job.originalFileName}` : "uploads / tmp / artifacts をローカル保存領域として使用"}
      </div>
      {job?.errorMessage && (
        <p className="mt-3 rounded-md bg-tomato/10 px-3 py-2 text-sm font-bold text-tomato">
          {job.errorMessage}
        </p>
      )}
      {job?.uploadDeletedAt && (
        <p className="mt-3 rounded-md bg-moss/10 px-3 py-2 text-sm font-bold text-moss">
          解析後にアップロード録画を削除しました。再解析には再アップロードが必要です。
        </p>
      )}
      {canCancel && (
        <button
          type="button"
          disabled={isCancelling}
          onClick={onCancel}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-tomato/35 bg-white px-3 text-sm font-bold text-tomato transition hover:bg-tomato/5 disabled:opacity-55"
        >
          <OctagonX className="h-4 w-4" aria-hidden="true" />
          {isCancelling ? "キャンセル中" : "解析をキャンセル"}
        </button>
      )}

      <div className="mt-5 border-t border-ink/10 pt-4">
        <div className="flex items-center gap-2 text-sm font-black">
          <SlidersHorizontal className="h-4 w-4 text-moss" aria-hidden="true" />
          再解析設定
        </div>
        <div className="mt-3 grid gap-3">
          <label className="grid gap-1 text-xs font-bold text-ink/60">
            フレーム間隔（秒）
            <input
              type="number"
              min={1}
              max={10}
              value={settings.everySeconds}
              onChange={(event) =>
                onSettingsChange?.({ ...settings, everySeconds: Number(event.target.value) })
              }
              className="h-10 rounded-md border border-ink/15 bg-white px-3 text-sm font-bold text-ink"
            />
          </label>
          <label className="grid gap-1 text-xs font-bold text-ink/60">
            最大フレーム数
            <input
              type="number"
              min={4}
              max={48}
              value={settings.maxFrames}
              onChange={(event) =>
                onSettingsChange?.({ ...settings, maxFrames: Number(event.target.value) })
              }
              className="h-10 rounded-md border border-ink/15 bg-white px-3 text-sm font-bold text-ink"
            />
          </label>
          <label className="grid gap-1 text-xs font-bold text-ink/60">
            OCR 最低信頼度
            <input
              type="number"
              min={0}
              max={1}
              step={0.05}
              value={settings.minConfidence}
              onChange={(event) =>
                onSettingsChange?.({ ...settings, minConfidence: Number(event.target.value) })
              }
              className="h-10 rounded-md border border-ink/15 bg-white px-3 text-sm font-bold text-ink"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={!canReanalyze || isReanalyzing}
          onClick={onReanalyze}
          className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-3 text-sm font-bold text-white transition hover:bg-moss disabled:opacity-55"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          {isReanalyzing ? "再解析中" : "この設定で再解析"}
        </button>
      </div>
    </div>
  );
}
