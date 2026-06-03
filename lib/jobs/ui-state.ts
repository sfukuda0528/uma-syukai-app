import type { AnalysisJob } from "./types";

export type MobileTabId = "upload" | "analysis" | "review" | "output";

export function nextTabAfterJobRefresh(currentTab: MobileTabId, job: AnalysisJob): MobileTabId {
  if (currentTab === "analysis" && job.status === "ready") {
    return "review";
  }

  return currentTab;
}

export function getCandidateStatsCount(job: AnalysisJob | null) {
  return job?.candidates.length ?? 0;
}
