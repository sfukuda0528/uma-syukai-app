"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import type { CandidateChange } from "@/lib/jobs/candidate-review";
import type { AppCandidate } from "@/lib/schemas/candidates";

type CandidateReviewProps = {
  candidates: AppCandidate[];
  isSaving?: boolean;
  onChange: (changes: CandidateChange[]) => void;
};

export function CandidateReview({ candidates, isSaving = false, onChange }: CandidateReviewProps) {
  const [adding, setAdding] = useState(false);
  const [addName, setAddName] = useState("");
  const [editingId, setEditingId] = useState<string>();
  const [editName, setEditName] = useState("");

  function startEdit(candidate: AppCandidate) {
    setEditingId(candidate.id);
    setEditName(candidate.displayName);
  }

  function submitAdd() {
    onChange([{ action: "add", displayName: addName }]);
    setAddName("");
    setAdding(false);
  }

  function submitEdit(candidateId: string) {
    onChange([{ action: "edit", id: candidateId, displayName: editName }]);
    setEditingId(undefined);
    setEditName("");
  }

  return (
    <div className="rounded-md border border-ink/10 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black">候補レビュー</h2>
          <p className="mt-1 text-sm leading-6 text-ink/60">OCR 結果は確定扱いにせず、確認・編集してから生成します。</p>
        </div>
        <button
          type="button"
          onClick={() => setAdding((value) => !value)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-ink/15 px-3 text-sm font-bold transition hover:border-tomato hover:text-tomato"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          候補追加
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        {adding && (
          <div className="grid gap-2 rounded-md border border-tomato/35 bg-tomato/5 p-3">
            <input
              value={addName}
              onChange={(event) => setAddName(event.target.value)}
              className="h-11 rounded-md border border-ink/15 bg-white px-3 text-sm font-bold outline-none focus:border-tomato"
              placeholder="候補名"
            />
            <button
              type="button"
              disabled={isSaving}
              onClick={submitAdd}
              className="h-11 rounded-md bg-ink px-3 text-sm font-bold text-white disabled:opacity-55"
            >
              追加
            </button>
          </div>
        )}
        {candidates.length === 0 && (
          <div className="rounded-md border border-dashed border-steel/35 bg-paper/70 p-4 text-sm font-bold text-ink/55">
            解析済み候補はまだありません。
          </div>
        )}
        {candidates.map((candidate) => (
          <article
            key={candidate.id}
            className={`rounded-md border p-3 ${
              candidate.status === "rejected"
                ? "border-ink/10 bg-white/65 opacity-65"
                : candidate.confirmed
                  ? "border-moss/25 bg-moss/5"
                  : "border-ink/10 bg-paper/70"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {editingId === candidate.id ? (
                  <div className="grid gap-2">
                    <input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      className="h-10 rounded-md border border-ink/15 bg-white px-3 text-sm font-black outline-none focus:border-tomato"
                    />
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => submitEdit(candidate.id)}
                      className="h-10 rounded-md bg-ink px-3 text-sm font-bold text-white disabled:opacity-55"
                    >
                      保存
                    </button>
                  </div>
                ) : (
                  <h3 className="break-words text-base font-black">{candidate.displayName}</h3>
                )}
                <p className="mt-1 text-xs text-ink/55">OCR: {candidate.rawText}</p>
              </div>
              <div className="grid shrink-0 justify-items-end gap-1">
                <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-steel">
                  {Math.round(candidate.confidence * 100)}%
                </span>
                <span className="rounded-full bg-ink/5 px-2 py-1 text-[11px] font-bold text-ink/60">
                  {candidate.status ?? (candidate.confirmed ? "confirmed" : "pending")}
                </span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-[1fr_44px_44px] gap-2">
              <button
                className="flex h-11 items-center justify-center gap-2 rounded-md bg-moss px-3 text-sm font-bold text-white disabled:opacity-55"
                type="button"
                disabled={isSaving || candidate.status === "rejected"}
                onClick={() => onChange([{ action: "confirm", id: candidate.id }])}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                確認
              </button>
              <button
                className="flex h-11 w-11 items-center justify-center rounded-md border border-ink/15 bg-white disabled:opacity-55"
                type="button"
                disabled={isSaving || candidate.status === "rejected"}
                onClick={() => startEdit(candidate)}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">編集</span>
              </button>
              <button
                className="flex h-11 w-11 items-center justify-center rounded-md border border-ink/15 bg-white disabled:opacity-55"
                type="button"
                disabled={isSaving}
                onClick={() => onChange([{ action: "reject", id: candidate.id }])}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">削除</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
