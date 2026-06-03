import type { AppCandidate } from "@/lib/schemas/candidates";
import type { GeneratedIcon } from "@/lib/icons/icon-generator";

export type JobStatus = "queued" | "extracting_frames" | "running_ocr" | "ready" | "failed";

export type ExtractedFrame = {
  frame: number;
  path: string;
};

export type TrimRange = {
  startSeconds: number;
  endSeconds?: number;
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
  errorMessage?: string;
};
