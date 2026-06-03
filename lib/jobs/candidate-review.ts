import type { AppCandidate, CandidateStatus } from "@/lib/schemas/candidates";

export type CandidateChange =
  | { action: "confirm"; id: string }
  | { action: "edit"; id: string; displayName: string }
  | { action: "reject"; id: string }
  | { action: "mark-folder"; id: string; isFolder: boolean }
  | { action: "bulk-confirm" }
  | { action: "bulk-unconfirm" }
  | { action: "add"; displayName: string };

export function applyCandidateChanges(candidates: AppCandidate[], changes: CandidateChange[]) {
  let next = candidates.map(normalizeCandidate);

  for (const change of changes) {
    if (change.action === "bulk-confirm") {
      next = next.map((candidate) => {
        if (candidate.status === "rejected" || candidate.status === "added" || candidate.isFolder) {
          return candidate;
        }

        return setReviewStatus(candidate, "confirmed");
      });
      continue;
    }

    if (change.action === "bulk-unconfirm") {
      next = next.map((candidate) => {
        if (candidate.status === "rejected" || candidate.isFolder || candidate.status === "added") {
          return candidate;
        }

        return setReviewStatus(candidate, "pending");
      });
      continue;
    }

    if (change.action === "add") {
      const displayName = cleanDisplayName(change.displayName);
      next = [
        ...next,
        {
          id: createCandidateId(displayName, next),
          rawText: displayName,
          displayName,
          confidence: 1,
          frame: 0,
          confirmed: true,
          status: "added"
        }
      ];
      continue;
    }

    next = next.map((candidate) => {
      if (candidate.id !== change.id) {
        return candidate;
      }

      if (change.action === "confirm") {
        return setReviewStatus(candidate, "confirmed");
      }

      if (change.action === "reject") {
        return setReviewStatus(candidate, "rejected");
      }

      if (change.action === "mark-folder") {
        return {
          ...candidate,
          confirmed: false,
          isFolder: change.isFolder,
          status: change.isFolder ? "folder" : "pending"
        };
      }

      return {
        ...candidate,
        displayName: cleanDisplayName(change.displayName),
        confirmed: true,
        status: "edited"
      };
    });
  }

  return next;
}

export function getConfirmedCandidates(candidates: AppCandidate[]) {
  return candidates.filter(
    (candidate) => candidate.confirmed && candidate.status !== "rejected" && !candidate.isFolder
  );
}

function normalizeCandidate(candidate: AppCandidate): AppCandidate {
  if (candidate.status) {
    return candidate;
  }

  return {
    ...candidate,
    status: candidate.confirmed ? "confirmed" : "pending"
  };
}

function setReviewStatus(candidate: AppCandidate, status: CandidateStatus): AppCandidate {
  return {
    ...candidate,
    confirmed: status === "confirmed",
    status
  };
}

function cleanDisplayName(displayName: string) {
  const cleaned = displayName.trim().replace(/\s+/g, " ");

  if (!cleaned) {
    throw new Error("候補名を入力してください。");
  }

  return cleaned;
}

function createCandidateId(displayName: string, candidates: AppCandidate[]) {
  const base = slugify(displayName) || "candidate";
  const existingIds = new Set(candidates.map((candidate) => candidate.id));
  let id = `added_${base}`;
  let index = 2;

  while (existingIds.has(id)) {
    id = `added_${base}_${index}`;
    index += 1;
  }

  return id;
}

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
