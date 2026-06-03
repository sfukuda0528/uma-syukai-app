import { describe, expect, it } from "vitest";
import type { AnalysisJob } from "./types";
import { prepareJobForReanalysis } from "./reanalysis";

const job: AnalysisJob = {
  id: "job_123",
  status: "ready",
  uploadPath: "uploads/job_123.mp4",
  uploadFileName: "job_123.mp4",
  originalFileName: "home.mp4",
  fileSize: 1024,
  mimeType: "video/mp4",
  createdAt: "2026-06-03T00:00:00Z",
  updatedAt: "2026-06-03T00:05:00Z",
  candidates: [
    {
      id: "mail",
      rawText: "Mail",
      displayName: "メール",
      confidence: 0.8,
      frame: 1,
      confirmed: true,
      status: "confirmed"
    }
  ],
  frames: [{ frame: 1, path: "tmp/job_123/frames/frame_001.jpg" }],
  generatedIcons: [
    {
      id: "icon_mail",
      candidateId: "mail",
      displayName: "メール",
      fileName: "mail.png",
      path: "artifacts/jobs/job_123/icons/mail.png",
      themeId: "paper-ink"
    }
  ]
};

describe("prepareJobForReanalysis", () => {
  it("resets derived review data and stores sanitized analysis settings", () => {
    expect(
      prepareJobForReanalysis(job, {
        everySeconds: 0,
        maxFrames: 64,
        minConfidence: 0.234
      })
    ).toMatchObject({
      status: "queued",
      candidates: [],
      frames: [],
      generatedIcons: [],
      errorMessage: undefined,
      analysisSettings: {
        everySeconds: 1,
        maxFrames: 48,
        minConfidence: 0.23
      }
    });
  });
});
