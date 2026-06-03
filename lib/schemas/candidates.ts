export type CandidateStatus = "pending" | "confirmed" | "edited" | "rejected" | "added";

export type AppCandidate = {
  id: string;
  rawText: string;
  displayName: string;
  confidence: number;
  frame: number;
  confirmed: boolean;
  status?: CandidateStatus;
  matchReason?: string;
  matchedAlias?: string;
};

export const sampleCandidates: AppCandidate[] = [
  {
    id: "sample-mail",
    rawText: "Mail",
    displayName: "メール",
    confidence: 0.82,
    frame: 12,
    confirmed: false,
    status: "pending"
  },
  {
    id: "sample-calendar",
    rawText: "Calendar",
    displayName: "カレンダー",
    confidence: 0.78,
    frame: 12,
    confirmed: false,
    status: "pending"
  },
  {
    id: "sample-memo",
    rawText: "Memo",
    displayName: "メモ",
    confidence: 0.74,
    frame: 21,
    confirmed: false,
    status: "pending"
  }
];
