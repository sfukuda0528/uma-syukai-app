import { describe, expect, it } from "vitest";
import type { AnalysisJob, JobStatus } from "./types";
import { getCandidateStatsCount, nextTabAfterJobRefresh, type MobileTabId } from "./ui-state";

function jobWith(status: JobStatus, candidates: AnalysisJob["candidates"] = []): AnalysisJob {
  return {
    id: `job-${status}`,
    status,
    uploadPath: "uploads/recording.mp4",
    uploadFileName: "recording.mp4",
    originalFileName: "recording.mp4",
    fileSize: 10,
    mimeType: "video/mp4",
    createdAt: "2026-06-03T00:00:00.000Z",
    updatedAt: "2026-06-03T00:00:00.000Z",
    candidates
  };
}

describe("nextTabAfterJobRefresh", () => {
  it("moves from analysis to review when refreshed job is ready", () => {
    expect(nextTabAfterJobRefresh("analysis", jobWith("ready"))).toBe("review");
  });

  it("keeps the current tab when the user is not watching analysis progress", () => {
    expect(nextTabAfterJobRefresh("upload", jobWith("ready"))).toBe("upload");
  });
});

describe("getCandidateStatsCount", () => {
  it("counts parsed review candidates, including pending, rejected, and folder candidates", () => {
    expect(
      getCandidateStatsCount(
        jobWith("ready", [
          {
            id: "ocr-mail",
            rawText: "Mail",
            displayName: "メール",
            confidence: 0.59,
            frame: 1,
            confirmed: false,
            status: "rejected",
            isFolder: true
          },
          {
            id: "added-memo",
            rawText: "Memo",
            displayName: "メモ",
            confidence: 1,
            frame: 0,
            confirmed: true,
            status: "added"
          }
        ])
      )
    ).toBe(2);
  });

  it("returns zero when no job is selected", () => {
    expect(getCandidateStatsCount(null)).toBe(0);
  });
});
