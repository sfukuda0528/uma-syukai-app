import type { AppCandidate } from "@/lib/schemas/candidates";
import type { GeneratedIcon } from "@/lib/icons/icon-generator";

export type JobStatus = "queued" | "extracting_frames" | "running_ocr" | "ready" | "failed" | "cancelled";

export type ExtractedFrame = {
  frame: number;
  path: string;
  page?: number;
  pageFrameCount?: number;
};

export type TrimRange = {
  startSeconds: number;
  endSeconds?: number;
};

export type AnalysisSettings = {
  everySeconds: number;
  maxFrames: number;
  minConfidence: number;
};

export type AnalysisJob = {
  id: string;
  status: JobStatus;
  uploadPath: string;
  uploadFileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  candidates: AppCandidate[];
  frames?: ExtractedFrame[];
  generatedIcons?: GeneratedIcon[];
  trim?: TrimRange;
  analysisSettings?: AnalysisSettings;
  deleteUploadAfterAnalysis?: boolean;
  uploadDeletedAt?: string;
  uploadDeleteError?: string;
  workerPid?: number;
  errorMessage?: string;
};
