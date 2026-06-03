import type { AnalysisJob, AnalysisSettings } from "./types";

export type ReanalysisSettingsInput = Partial<AnalysisSettings>;

export function prepareJobForReanalysis(
  _job: AnalysisJob,
  settings: ReanalysisSettingsInput = {}
): Pick<
  AnalysisJob,
  "analysisSettings" | "candidates" | "errorMessage" | "frames" | "generatedIcons" | "status"
> {
  return {
    analysisSettings: normalizeAnalysisSettings(settings),
    candidates: [],
    errorMessage: undefined,
    frames: [],
    generatedIcons: [],
    status: "queued"
  };
}

export function normalizeAnalysisSettings(settings: ReanalysisSettingsInput): AnalysisSettings {
  return {
    everySeconds: clampInteger(settings.everySeconds, 1, 10, 2),
    maxFrames: clampInteger(settings.maxFrames, 4, 48, 12),
    minConfidence: clampNumber(settings.minConfidence, 0, 1, 0.55)
  };
}

function clampInteger(value: unknown, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.round(Math.min(max, Math.max(min, value)) * 100) / 100;
}
