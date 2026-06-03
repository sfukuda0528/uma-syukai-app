import { CircleDashed, Cpu, FolderOpen } from "lucide-react";
import type { AnalysisJob, JobStatus } from "@/lib/jobs/types";

type StatusPanelProps = {
  job: AnalysisJob | null;
};

const statusLabels: Record<JobStatus, string> = {
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

  if (step === "upload") {
    return "完了";
  }

  if (step === "frames") {
    return ["extracting_frames", "running_ocr", "ready"].includes(job.status) ? "処理中/完了" : "待機";
  }

  return ["running_ocr", "ready"].includes(job.status) ? "処理中/完了" : "待機";
}

export function StatusPanel({ job }: StatusPanelProps) {
  const steps = [
    { label: "アップロード保存", state: getStepState(job, "upload") },
    { label: "代表フレーム抽出", state: getStepState(job, "frames") },
    { label: "OCR 候補生成", state: getStepState(job, "ocr") }
  ];

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
    </div>
  );
}
