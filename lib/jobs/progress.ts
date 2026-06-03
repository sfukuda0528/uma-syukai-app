import type { AnalysisJob, JobStatus } from "./types";

export type AnalysisProgressStepId = "upload" | "frames" | "ocr";
export type AnalysisProgressStepState = "pending" | "active" | "done" | "failed" | "cancelled";

export type AnalysisProgressStep = {
  id: AnalysisProgressStepId;
  label: string;
  detail: string;
  state: AnalysisProgressStepState;
};

const activeStatuses = new Set<JobStatus>(["queued", "extracting_frames", "running_ocr"]);

export function isAnalysisInProgress(status: JobStatus) {
  return activeStatuses.has(status);
}

export function buildAnalysisProgressSteps(job: AnalysisJob | null): AnalysisProgressStep[] {
  const frameCount = job?.frames?.length ?? 0;
  const candidateCount = job?.candidates.length ?? 0;

  if (!job) {
    return [
      step("upload", "アップロード保存", "録画を選択すると開始します", "pending"),
      step("frames", "代表フレーム抽出", "保存後に開始します", "pending"),
      step("ocr", "OCR 候補生成", "代表フレーム抽出後に開始します", "pending")
    ];
  }

  if (job.status === "failed") {
    return [
      step("upload", "アップロード保存", "保存完了", "done"),
      step("frames", "代表フレーム抽出", frameDetail(frameCount), "failed"),
      step("ocr", "OCR 候補生成", job.errorMessage ?? "処理を完了できませんでした", "failed")
    ];
  }

  if (job.status === "cancelled") {
    return [
      step("upload", "アップロード保存", "保存完了", "done"),
      step("frames", "代表フレーム抽出", frameDetail(frameCount), "cancelled"),
      step("ocr", "OCR 候補生成", "キャンセルされました", "cancelled")
    ];
  }

  if (job.status === "queued") {
    return [
      step("upload", "アップロード保存", "アップロード保存を確認しています", "active"),
      step("frames", "代表フレーム抽出", "保存後に開始します", "pending"),
      step("ocr", "OCR 候補生成", "代表フレーム抽出後に開始します", "pending")
    ];
  }

  if (job.status === "extracting_frames") {
    return [
      step("upload", "アップロード保存", "保存完了", "done"),
      step("frames", "代表フレーム抽出", frameDetail(frameCount), "active"),
      step("ocr", "OCR 候補生成", "代表フレーム抽出後に開始します", "pending")
    ];
  }

  if (job.status === "running_ocr") {
    return [
      step("upload", "アップロード保存", "保存完了", "done"),
      step("frames", "代表フレーム抽出", frameDetail(frameCount), "done"),
      step("ocr", "OCR 候補生成", candidateCount > 0 ? `候補 ${candidateCount} 件` : "候補を読み取っています", "active")
    ];
  }

  return [
    step("upload", "アップロード保存", "保存完了", "done"),
    step("frames", "代表フレーム抽出", frameDetail(frameCount), "done"),
    step("ocr", "OCR 候補生成", `候補 ${candidateCount} 件`, "done")
  ];
}

function step(
  id: AnalysisProgressStepId,
  label: string,
  detail: string,
  state: AnalysisProgressStepState
): AnalysisProgressStep {
  return { id, label, detail, state };
}

function frameDetail(frameCount: number) {
  return frameCount > 0 ? `${frameCount} 枚抽出済み` : "フレームを抽出しています";
}
