import { describe, expect, it } from "vitest";
import type { AppCandidate } from "@/lib/schemas/candidates";
import { applyCandidateChanges, getConfirmedCandidates } from "./candidate-review";

const candidates: AppCandidate[] = [
  {
    id: "mail",
    rawText: "Mail",
    displayName: "メール",
    confidence: 0.82,
    frame: 12,
    confirmed: false,
    status: "pending"
  },
  {
    id: "calendar",
    rawText: "Calendar",
    displayName: "カレンダー",
    confidence: 0.78,
    frame: 12,
    confirmed: false,
    status: "pending"
  }
];

describe("applyCandidateChanges", () => {
  it("confirms, edits, rejects, and adds review candidates", () => {
    const reviewed = applyCandidateChanges(candidates, [
      { id: "mail", action: "confirm" },
      { id: "calendar", action: "edit", displayName: "予定表" },
      { id: "mail", action: "edit", displayName: "メール App" },
      { id: "calendar", action: "reject" },
      { action: "add", displayName: "メモ" }
    ]);

    expect(reviewed).toHaveLength(3);
    expect(reviewed[0]).toMatchObject({
      id: "mail",
      displayName: "メール App",
      confirmed: true,
      status: "edited"
    });
    expect(reviewed[1]).toMatchObject({
      id: "calendar",
      displayName: "予定表",
      confirmed: false,
      status: "rejected"
    });
    expect(reviewed[2]).toMatchObject({
      rawText: "メモ",
      displayName: "メモ",
      confidence: 1,
      confirmed: true,
      status: "added"
    });
  });

  it("returns only usable confirmed candidates for generation", () => {
    const reviewed = applyCandidateChanges(candidates, [
      { id: "mail", action: "confirm" },
      { id: "calendar", action: "reject" }
    ]);

    expect(getConfirmedCandidates(reviewed).map((candidate) => candidate.id)).toEqual(["mail"]);
  });

  it("rejects blank candidate names", () => {
    expect(() =>
      applyCandidateChanges(candidates, [{ id: "mail", action: "edit", displayName: " " }])
    ).toThrow("候補名を入力してください。");
  });
});
