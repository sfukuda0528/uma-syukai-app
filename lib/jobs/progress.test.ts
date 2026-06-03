import { describe, expect, it } from "vitest";
import { buildAnalysisProgressSteps, isAnalysisInProgress } from "./progress";
import type { AnalysisJob } from "./types";

function job(overrides: Partial<AnalysisJob>): AnalysisJob {
  return {
    id: "job_test",
    status: "queued",
    uploadPath: "uploads/job_test.mp4",
    uploadFileName: "job_test.mp4",
    originalFileName: "home.mp4",
    fileSize: 1024,
    mimeType: "video/mp4",
    createdAt: "2026-06-03T00:00:00.000Z",
    updatedAt: "2026-06-03T00:00:00.000Z",
    candidates: [],
    ...overrides
  };
}

describe("buildAnalysisProgressSteps", () => {
  it("marks upload as active while the job is queued", () => {
    const steps = buildAnalysisProgressSteps(job({ status: "queued" }));

    expect(steps.map((step) => [step.id, step.state, step.detail])).toEqual([
      ["upload", "active", "アップロード保存を確認しています"],
      ["frames", "pending", "保存後に開始します"],
      ["ocr", "pending", "代表フレーム抽出後に開始します"]
    ]);
  });

  it("shows extracted frame count while frame extraction is active", () => {
    const steps = buildAnalysisProgressSteps(
      job({
        status: "extracting_frames",
        frames: [
          { frame: 1, path: "frame-1.png" },
          { frame: 2, path: "frame-2.png" }
        ]
      })
    );

    expect(steps.map((step) => [step.id, step.state, step.detail])).toEqual([
      ["upload", "done", "保存完了"],
      ["frames", "active", "2 枚抽出済み"],
      ["ocr", "pending", "代表フレーム抽出後に開始します"]
    ]);
  });

  it("marks all processing steps as done when the job is ready", () => {
    const steps = buildAnalysisProgressSteps(
      job({
        candidates: [
          {
            confidence: 0.9,
            confirmed: false,
            displayName: "Calendar",
            frame: 1,
            id: "candidate_calendar",
            rawText: "Calendar",
            status: "pending"
          }
        ],
        frames: [{ frame: 1, path: "frame-1.png" }],
        status: "ready"
      })
    );

    expect(steps.map((step) => [step.state, step.detail])).toEqual([
      ["done", "保存完了"],
      ["done", "1 枚抽出済み"],
      ["done", "候補 1 件"]
    ]);
  });
});

describe("isAnalysisInProgress", () => {
  it("detects statuses that should keep polling", () => {
    expect(isAnalysisInProgress("queued")).toBe(true);
    expect(isAnalysisInProgress("extracting_frames")).toBe(true);
    expect(isAnalysisInProgress("running_ocr")).toBe(true);
    expect(isAnalysisInProgress("ready")).toBe(false);
    expect(isAnalysisInProgress("failed")).toBe(false);
    expect(isAnalysisInProgress("cancelled")).toBe(false);
  });
});
