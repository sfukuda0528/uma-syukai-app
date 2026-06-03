"use client";

import { useState } from "react";
import { Check, Folder, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { CandidateChange } from "@/lib/jobs/candidate-review";
import type { AppCandidate } from "@/lib/schemas/candidates";

type CandidateReviewProps = {
  candidates: AppCandidate[];
  isSaving?: boolean;
  jobId?: string;
  onChange: (changes: CandidateChange[]) => void;
};

export function CandidateReview({ candidates, isSaving = false, jobId, onChange }: CandidateReviewProps) {
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isSaving || candidates.length === 0}
            onClick={() => onChange([{ action: "bulk-confirm" }])}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-moss px-3 text-sm font-bold text-white transition disabled:opacity-55"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            一括確認
          </button>
          <button
            type="button"
            disabled={isSaving || candidates.length === 0}
            onClick={() => onChange([{ action: "bulk-unconfirm" }])}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-ink/15 bg-white transition hover:border-tomato hover:text-tomato disabled:opacity-55"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">一括未確認化</span>
          </button>
          <button
            type="button"
            onClick={() => setAdding((value) => !value)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-ink/15 px-3 text-sm font-bold transition hover:border-tomato hover:text-tomato"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            候補追加
          </button>
        </div>
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
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold text-ink/55">
                  {candidate.page !== undefined && (
                    <span className="rounded-full bg-white px-2 py-1">Page {candidate.page}</span>
                  )}
                  {candidate.homePosition && (
                    <span className="rounded-full bg-white px-2 py-1">
                      {formatHomePosition(candidate.homePosition)}
                    </span>
                  )}
                  <span className="rounded-full bg-white px-2 py-1">Frame {candidate.frame}</span>
                  {candidate.pageFrameCount !== undefined && (
                    <span className="rounded-full bg-white px-2 py-1">
                      Stable x{candidate.pageFrameCount}
                    </span>
                  )}
                  {candidate.boundingBox && (
                    <span className="rounded-full bg-white px-2 py-1">
                      Box {candidate.boundingBox.x},{candidate.boundingBox.y} {candidate.boundingBox.width}x
                      {candidate.boundingBox.height}
                    </span>
                  )}
                </div>
                {jobId && candidate.boundingBox && (
                  <div className="mt-3 h-32 overflow-hidden rounded-md border border-ink/10 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/jobs/${jobId}/frames/${candidate.frame}`}
                      alt=""
                      className="h-full w-full object-cover"
                      style={getCropPreviewStyle(candidate)}
                    />
                  </div>
                )}
              </div>
              <div className="grid shrink-0 justify-items-end gap-1">
                <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-steel">
                  {Math.round(candidate.confidence * 100)}%
                </span>
                <span className="rounded-full bg-ink/5 px-2 py-1 text-[11px] font-bold text-ink/60">
                  {candidate.status ?? (candidate.confirmed ? "confirmed" : "pending")}
                </span>
                {candidate.isFolder && (
                  <span className="rounded-full bg-tomato/10 px-2 py-1 text-[11px] font-bold text-tomato">
                    folder
                  </span>
                )}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-[1fr_44px_44px_44px] gap-2">
              <button
                className="flex h-11 items-center justify-center gap-2 rounded-md bg-moss px-3 text-sm font-bold text-white disabled:opacity-55"
                type="button"
                disabled={isSaving || candidate.status === "rejected" || candidate.isFolder}
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
                className={`flex h-11 w-11 items-center justify-center rounded-md border disabled:opacity-55 ${
                  candidate.isFolder ? "border-tomato/30 bg-tomato/10 text-tomato" : "border-ink/15 bg-white"
                }`}
                type="button"
                disabled={isSaving || candidate.status === "rejected"}
                onClick={() =>
                  onChange([{ action: "mark-folder", id: candidate.id, isFolder: !candidate.isFolder }])
                }
              >
                <Folder className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">フォルダ扱いを切り替え</span>
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

function getCropPreviewStyle(candidate: AppCandidate) {
  if (!candidate.boundingBox || !candidate.frameWidth || !candidate.frameHeight) {
    return undefined;
  }

  const centerX = ((candidate.boundingBox.x + candidate.boundingBox.width / 2) / candidate.frameWidth) * 100;
  const centerY = ((candidate.boundingBox.y + candidate.boundingBox.height / 2) / candidate.frameHeight) * 100;

  return {
    objectPosition: `${centerX.toFixed(1)}% ${centerY.toFixed(1)}%`,
    transform: "scale(2.6)",
  };
}

function formatHomePosition(position: NonNullable<AppCandidate["homePosition"]>) {
  if (position.area === "dock") {
    return `Dock ${position.column ?? ""}`.trim();
  }

  if (position.area === "widgetArea") {
    return "Widget";
  }

  if (position.area === "mainGrid") {
    const row = position.row ? `R${position.row}` : "";
    const column = position.column ? `C${position.column}` : "";
    return ["Grid", row, column].filter(Boolean).join(" ");
  }

  return "位置未推定";
}
