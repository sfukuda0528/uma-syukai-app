import { describe, expect, it } from "vitest";
import type { AnalysisJob } from "./types";
import { findFramePreview } from "./frame-preview";

const job: AnalysisJob = {
  id: "job-1",
  status: "ready",
  uploadPath: "uploads/recording.mp4",
  uploadFileName: "recording.mp4",
  originalFileName: "recording.mp4",
  fileSize: 10,
  mimeType: "video/mp4",
  createdAt: "2026-06-03T00:00:00.000Z",
  updatedAt: "2026-06-03T00:00:00.000Z",
  candidates: [],
  frames: [
    { frame: 4, path: "tmp/job-1/frames/frame_004.jpg", page: 2, pageFrameCount: 3 },
    { frame: 8, path: "tmp/job-1/frames/frame_008.jpg", page: 3, pageFrameCount: 1 }
  ]
};

describe("findFramePreview", () => {
  it("returns the frame path and metadata for an extracted frame", () => {
    expect(findFramePreview(job, 4)).toEqual({
      frame: 4,
      path: "tmp/job-1/frames/frame_004.jpg",
      page: 2,
      pageFrameCount: 3
    });
  });

  it("returns null when the requested frame is not part of the job", () => {
    expect(findFramePreview(job, 999)).toBeNull();
  });
});
