import type { AnalysisJob, ExtractedFrame } from "./types";

export function findFramePreview(job: AnalysisJob, frameNumber: number): ExtractedFrame | null {
  return job.frames?.find((frame) => frame.frame === frameNumber) ?? null;
}
