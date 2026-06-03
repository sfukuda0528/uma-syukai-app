import {
  CheckCircle2,
  Clock3,
  Cpu,
  FolderOpen,
  LoaderCircle,
  OctagonX,
  RotateCcw,
  SlidersHorizontal,
  XCircle
} from "lucide-react";
import {
  buildAnalysisProgressSteps,
  isAnalysisInProgress,
  type AnalysisProgressStepState
} from "@/lib/jobs/progress";
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
  const steps = buildAnalysisProgressSteps(job);
  const activeStep = steps.find((step) => step.state === "active");
  const doneWeight = steps.reduce((total, step) => {
    if (step.state === "done") {
      return total + 1;
    }
    if (step.state === "active") {
      return total + 0.5;
    }
    return total;
  }, 0);
  const progressPercent = Math.round((doneWeight / steps.length) * 100);
  const isProcessing = job ? isAnalysisInProgress(job.status) || isReanalyzing : false;
  const canCancel = job ? ["queued", "extracting_frames", "running_ocr"].includes(job.status) : false;
  const canReanalyze = Boolean(job && !job.uploadDeletedAt);

  return (
    <div className="rounded-md border border-ink/10 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">解析ステータス</h2>
          <p className="mt-1 text-sm text-ink/60">Next.js から Python ワーカーへ処理を渡します。</p>
        </div>
        {isProcessing ? (
          <LoaderCircle className="h-5 w-5 animate-spin text-tomato" aria-hidden="true" />
        ) : (
          <Cpu className="h-5 w-5 text-steel" aria-hidden="true" />
        )}
      </div>

      <div className="mt-5 rounded-md border border-ink/10 bg-paper/75 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-steel">
              {isProcessing ? "Processing" : "Status"}
            </p>
            <p className="mt-1 truncate text-sm font-black">
              {activeStep ? `${activeStep.label}中` : job ? statusLabels[job.status] : "待機中"}
            </p>
          </div>
          <span className="shrink-0 text-lg font-black tabular-nums text-moss">{progressPercent}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isProcessing ? "bg-tomato" : "bg-moss"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {activeStep && (
          <p className="mt-2 text-xs font-bold text-ink/58">{activeStep.detail}</p>
        )}
      </div>

      <div className="mt-5 grid gap-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`grid min-h-16 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border px-3 py-3 ${stepClassName(
              step.state
            )}`}
          >
            <StepIcon state={step.state} />
            <span className="min-w-0">
              <span className="block text-sm font-bold leading-tight">{step.label}</span>
              <span className="mt-1 block truncate text-xs text-ink/55">{step.detail}</span>
            </span>
            <span className="shrink-0 text-xs font-bold text-ink/55">{stepStateLabel(step.state)}</span>
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

function StepIcon({ state }: { state: AnalysisProgressStepState }) {
  if (state === "done") {
    return <CheckCircle2 className="h-5 w-5 text-moss" aria-hidden="true" />;
  }
  if (state === "active") {
    return <LoaderCircle className="h-5 w-5 animate-spin text-tomato" aria-hidden="true" />;
  }
  if (state === "failed") {
    return <XCircle className="h-5 w-5 text-tomato" aria-hidden="true" />;
  }
  if (state === "cancelled") {
    return <OctagonX className="h-5 w-5 text-steel" aria-hidden="true" />;
  }
  return <Clock3 className="h-5 w-5 text-steel" aria-hidden="true" />;
}

function stepClassName(state: AnalysisProgressStepState) {
  if (state === "done") {
    return "border-moss/20 bg-moss/5";
  }
  if (state === "active") {
    return "border-tomato/30 bg-tomato/10 shadow-sm";
  }
  if (state === "failed") {
    return "border-tomato/25 bg-tomato/10";
  }
  if (state === "cancelled") {
    return "border-steel/25 bg-steel/10";
  }
  return "border-ink/10 bg-paper";
}

function stepStateLabel(state: AnalysisProgressStepState) {
  const labels: Record<AnalysisProgressStepState, string> = {
    active: "処理中",
    cancelled: "中止",
    done: "完了",
    failed: "失敗",
    pending: "待機"
  };

  return labels[state];
}
