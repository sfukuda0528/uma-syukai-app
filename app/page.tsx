"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, CheckSquare, Download, FileVideo, History, ListChecks, Sparkles, Trash2, Upload } from "lucide-react";
import { StatusPanel } from "@/components/analysis/status-panel";
import { ThemePicker } from "@/components/icon-studio/theme-picker";
import { CandidateReview } from "@/components/review/candidate-review";
import { UploadPanel } from "@/components/upload/upload-panel";
import { readJsonResponse } from "@/lib/http/json-response";
import type { IconTheme } from "@/lib/icons/icon-generator";
import type { CandidateChange } from "@/lib/jobs/candidate-review";
import { isAnalysisInProgress } from "@/lib/jobs/progress";
import { getCandidateStatsCount, nextTabAfterJobRefresh, type MobileTabId } from "@/lib/jobs/ui-state";
import type { AnalysisJob, AnalysisSettings } from "@/lib/jobs/types";

const stats = [
  { label: "録画", icon: FileVideo },
  { label: "解析", icon: Activity },
  { label: "候補", icon: ListChecks },
  { label: "生成", icon: Sparkles }
];

const mobileTabs = [
  { id: "upload", label: "録画", icon: Upload },
  { id: "analysis", label: "解析", icon: Activity },
  { id: "review", label: "候補", icon: ListChecks },
  { id: "output", label: "生成", icon: Download }
] as const;

type MobileTab = MobileTabId;

type JobHistoryPanelProps = {
  activeJobId?: string;
  jobs: AnalysisJob[];
  onSelect: (job: AnalysisJob) => void;
};

function JobHistoryPanel({ activeJobId, jobs, onSelect }: JobHistoryPanelProps) {
  if (jobs.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 rounded-md border border-ink/10 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-sm font-black">
        <History className="h-4 w-4 text-moss" aria-hidden="true" />
        ジョブ履歴
      </div>
      <div className="grid gap-2">
        {jobs.slice(0, 5).map((historyJob) => (
          <button
            key={historyJob.id}
            type="button"
            onClick={() => onSelect(historyJob)}
            className={`grid min-h-14 grid-cols-[1fr_auto] items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${
              historyJob.id === activeJobId
                ? "border-moss/35 bg-moss/5"
                : "border-ink/10 bg-paper/60 hover:border-moss/30"
            }`}
          >
            <span className="min-w-0">
              <span className="block truncate font-bold">{historyJob.originalFileName}</span>
              <span className="mt-0.5 block text-xs text-ink/55">
                {formatDate(historyJob.updatedAt)} / 候補 {historyJob.candidates.length} / 生成{" "}
                {historyJob.generatedIcons?.length ?? 0}
              </span>
            </span>
            <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-steel">
              {historyJob.status}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

type OutputPanelProps = {
  icons: NonNullable<AnalysisJob["generatedIcons"]>;
  isGenerating: boolean;
  jobId?: string;
  onGenerate: () => void;
};

function OutputPanel({ icons, isGenerating, jobId, onGenerate }: OutputPanelProps) {
  return (
    <div className="rounded-md border border-ink/10 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">生成物</h2>
          <p className="mt-1 text-sm leading-6 text-ink/65">
            確認済み候補から PNG を生成し、個別またはまとめて保存します。
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-ink text-white">
          <Download className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <button
        type="button"
        disabled={isGenerating}
        onClick={onGenerate}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-bold text-white transition hover:bg-moss"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        {isGenerating ? "生成中" : "PNG を生成"}
      </button>
      {jobId && icons.length > 0 && (
        <a
          href={`/api/jobs/${jobId}/icons/archive`}
          download
          className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-ink/15 bg-white px-4 text-sm font-bold text-ink transition hover:border-moss hover:text-moss"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          ZIP でまとめて保存
        </a>
      )}
      <div className="mt-4 grid gap-2">
        {icons.length === 0 && (
          <div className="rounded-md border border-dashed border-steel/35 bg-paper/70 p-3 text-sm font-bold text-ink/55">
            生成済みアイコンはまだありません。
          </div>
        )}
        {icons.map((icon) => (
          <a
            key={icon.id}
            href={jobId ? `/api/jobs/${jobId}/icons/${encodeURIComponent(icon.id)}` : "#"}
            download={icon.fileName}
            className="flex min-h-16 items-center justify-between gap-3 rounded-md border border-ink/10 bg-paper/70 px-3 py-2 text-sm font-bold transition hover:border-moss hover:text-moss"
          >
            <span className="flex min-w-0 items-center gap-3">
              {jobId && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/jobs/${jobId}/icons/${encodeURIComponent(icon.id)}`}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-md border border-ink/10 bg-white object-cover"
                />
              )}
              <span className="min-w-0 truncate">{icon.displayName}</span>
            </span>
            <span className="shrink-0 text-xs text-ink/55">{icon.fileName}</span>
          </a>
        ))}
      </div>
      {icons.length > 0 && (
        <div className="mt-4 rounded-md border border-moss/20 bg-moss/5 p-3">
          <div className="flex items-center gap-2 text-sm font-black text-ink">
            <CheckSquare className="h-4 w-4 text-moss" aria-hidden="true" />
            ショートカット設定チェック
          </div>
          <div className="mt-3 grid gap-2">
            {icons.map((icon) => (
              <label
                key={`setup-${icon.id}`}
                className="flex min-h-12 items-start gap-3 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm leading-6"
              >
                <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-moss" />
                <span className="min-w-0">
                  <span className="block font-bold">{icon.displayName}</span>
                  <span className="block text-xs leading-5 text-ink/58">
                    ショートカットで「App を開く」を作成し、ホーム画面追加時に {icon.fileName} を選択
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<MobileTab>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [jobHistory, setJobHistory] = useState<AnalysisJob[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isStarting, setIsStarting] = useState(false);
  const [isSavingCandidates, setIsSavingCandidates] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState("paper-ink");
  const [customTheme, setCustomTheme] = useState<IconTheme>({
    id: "custom",
    name: "Custom",
    description: "User edited theme",
    palette: ["#f7f4ec", "#171717", "#d85c3a"]
  });
  const [trim, setTrim] = useState<{ endSeconds?: number; startSeconds?: number }>({});
  const [deleteUploadAfterAnalysis, setDeleteUploadAfterAnalysis] = useState(true);
  const [analysisSettings, setAnalysisSettings] = useState<AnalysisSettings>({
    everySeconds: 2,
    maxFrames: 12,
    minConfidence: 0.55
  });

  useEffect(() => {
    void loadJobHistory();
  }, []);

  async function loadJobHistory() {
    try {
      const response = await fetch("/api/jobs");
      const payload = await readJsonResponse<{ jobs?: AnalysisJob[] }>(response);

      if (payload.jobs) {
        setJobHistory(payload.jobs);
      }
    } catch {
      // 履歴は補助導線なので、取得失敗時も主操作を止めない。
    }
  }

  function selectHistoryJob(nextJob: AnalysisJob) {
    setJob(nextJob);
    setSelectedFile(null);
    setErrorMessage(undefined);
    setAnalysisSettings(nextJob.analysisSettings ?? { everySeconds: 2, maxFrames: 12, minConfidence: 0.55 });
    setActiveTab(nextJob.status === "ready" ? "review" : "analysis");
  }

  const refreshJob = useCallback(async (jobId: string) => {
    const response = await fetch(`/api/jobs/${jobId}`);
    const payload = await readJsonResponse<{ job?: AnalysisJob; error?: string }>(response);

    if (!payload.job) {
      throw new Error(payload.error ?? "ジョブ状態を取得できませんでした。");
    }

    setJob(payload.job);
    setJobHistory((jobs) => [payload.job!, ...jobs.filter((historyJob) => historyJob.id !== payload.job!.id)]);
    setActiveTab((currentTab) => nextTabAfterJobRefresh(currentTab, payload.job!));
    if (payload.job.analysisSettings) {
      setAnalysisSettings(payload.job.analysisSettings);
    }

    return payload.job;
  }, []);

  useEffect(() => {
    if (!job || !isAnalysisInProgress(job.status)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshJob(job.id).catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : "ジョブ状態を取得できませんでした。");
      });
    }, 1200);

    return () => window.clearInterval(intervalId);
  }, [job, refreshJob]);

  async function startJob() {
    if (!selectedFile) {
      setErrorMessage("動画ファイルを選択してください。");
      return;
    }

    setIsStarting(true);
    setErrorMessage(undefined);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (trim.startSeconds !== undefined) {
        formData.append("trimStartSeconds", String(trim.startSeconds));
      }
      if (trim.endSeconds !== undefined) {
        formData.append("trimEndSeconds", String(trim.endSeconds));
      }
      formData.append("deleteUploadAfterAnalysis", String(deleteUploadAfterAnalysis));

      const response = await fetch("/api/jobs", {
        body: formData,
        method: "POST"
      });
      const payload = await readJsonResponse<{ job?: AnalysisJob; error?: string }>(response);

      if (!payload.job) {
        throw new Error(payload.error ?? "アップロードに失敗しました。");
      }

      const createdJob = payload.job;
      setJob(createdJob);
      setJobHistory((jobs) => [createdJob, ...jobs.filter((historyJob) => historyJob.id !== createdJob.id)]);
      setAnalysisSettings(createdJob.analysisSettings ?? analysisSettings);
      setActiveTab("analysis");

      window.setTimeout(() => {
        void refreshJob(createdJob.id).catch((error) => {
          setErrorMessage(error instanceof Error ? error.message : "ジョブ状態を取得できませんでした。");
        });
      }, 800);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "アップロードに失敗しました。");
    } finally {
      setIsStarting(false);
    }
  }

  async function updateCandidates(changes: CandidateChange[]) {
    if (!job) {
      setErrorMessage("先に解析ジョブを開始してください。");
      return;
    }

    setIsSavingCandidates(true);
    setErrorMessage(undefined);

    try {
      const response = await fetch(`/api/jobs/${job.id}/candidates`, {
        body: JSON.stringify({ changes }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH"
      });
      const payload = await readJsonResponse<{ job?: AnalysisJob; error?: string }>(response);

      if (!payload.job) {
        throw new Error(payload.error ?? "候補を更新できませんでした。");
      }

      setJob(payload.job);
      setJobHistory((jobs) => [payload.job!, ...jobs.filter((historyJob) => historyJob.id !== payload.job!.id)]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "候補を更新できませんでした。");
    } finally {
      setIsSavingCandidates(false);
    }
  }

  async function reanalyzeJob() {
    if (!job) {
      setErrorMessage("先に解析ジョブを開始してください。");
      return;
    }

    setIsReanalyzing(true);
    setErrorMessage(undefined);

    try {
      const response = await fetch(`/api/jobs/${job.id}/reanalyze`, {
        body: JSON.stringify({ settings: analysisSettings }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const payload = await readJsonResponse<{ job?: AnalysisJob; error?: string }>(response);

      if (!payload.job) {
        throw new Error(payload.error ?? "再解析を開始できませんでした。");
      }

      setJob(payload.job);
      setJobHistory((jobs) => [payload.job!, ...jobs.filter((historyJob) => historyJob.id !== payload.job!.id)]);
      if (payload.job.analysisSettings) {
        setAnalysisSettings(payload.job.analysisSettings);
      }
      setActiveTab("analysis");

      window.setTimeout(() => {
        void refreshJob(payload.job!.id).catch((error) => {
          setErrorMessage(error instanceof Error ? error.message : "ジョブ状態を取得できませんでした。");
        });
      }, 800);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "再解析を開始できませんでした。");
    } finally {
      setIsReanalyzing(false);
    }
  }

  async function cancelJob() {
    if (!job) {
      return;
    }

    setIsCancelling(true);
    setErrorMessage(undefined);

    try {
      const response = await fetch(`/api/jobs/${job.id}/cancel`, { method: "POST" });
      const payload = await readJsonResponse<{ job?: AnalysisJob; error?: string }>(response);

      if (!payload.job) {
        throw new Error(payload.error ?? "解析をキャンセルできませんでした。");
      }

      setJob(payload.job);
      setJobHistory((jobs) => [payload.job!, ...jobs.filter((historyJob) => historyJob.id !== payload.job!.id)]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "解析をキャンセルできませんでした。");
    } finally {
      setIsCancelling(false);
    }
  }

  async function generateIcons() {
    if (!job) {
      setErrorMessage("先に解析ジョブを開始してください。");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(undefined);

    try {
      const response = await fetch(`/api/jobs/${job.id}/icons`, {
        body: JSON.stringify(
          selectedThemeId === customTheme.id
            ? { theme: customTheme, themeId: selectedThemeId }
            : { themeId: selectedThemeId }
        ),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      const payload = await readJsonResponse<{ job?: AnalysisJob; error?: string }>(response);

      if (!payload.job) {
        throw new Error(payload.error ?? "アイコンを生成できませんでした。");
      }

      setJob(payload.job);
      setJobHistory((jobs) => [payload.job!, ...jobs.filter((historyJob) => historyJob.id !== payload.job!.id)]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "アイコンを生成できませんでした。");
    } finally {
      setIsGenerating(false);
    }
  }

  async function deleteJob() {
    if (!job) {
      return;
    }

    const ok = window.confirm("録画、解析結果、生成物を削除します。よろしいですか？");
    if (!ok) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(undefined);

    try {
      const response = await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
      await readJsonResponse<{ ok?: boolean; error?: string }>(response);

      setJob(null);
      setJobHistory((jobs) => jobs.filter((historyJob) => historyJob.id !== job.id));
      setSelectedFile(null);
      setAnalysisSettings({ everySeconds: 2, maxFrames: 12, minConfidence: 0.55 });
      setActiveTab("upload");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "ジョブを削除できませんでした。");
    } finally {
      setIsDeleting(false);
    }
  }

  const statValues = [
    job ? "1" : "0",
    job ? job.status : "待機",
    String(getCandidateStatsCount(job)),
    String(job?.generatedIcons?.length ?? 0)
  ];

  return (
    <main className="min-h-screen bg-paper pb-24 text-ink">
      <section className="border-b border-ink/10 bg-[radial-gradient(circle_at_top_left,#fff7d1,transparent_30%),linear-gradient(135deg,#f7f4ec_0%,#ecf1e8_52%,#f4e5dd_100%)]">
        <div className="mx-auto w-full max-w-md px-4 py-5 sm:px-5">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-moss">
                  Local Web MVP
                </p>
                <h1 className="max-w-4xl text-3xl font-black leading-tight sm:text-4xl">
                  Home Icon Studio
                </h1>
              </div>
              <span className="mt-1 shrink-0 rounded-full bg-white/75 px-3 py-1 text-xs font-bold text-moss shadow-sm">
                {job?.status ?? "待機"}
              </span>
            </div>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/75">
              ホーム画面録画に見えているアプリ名候補を抽出し、確認済み候補から
              シンプルなオリジナル PNG アイコンを作るための作業台です。
            </p>
            <div className="mt-5 grid grid-cols-4 gap-2">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="min-h-20 rounded-md border border-ink/10 bg-white/70 p-3 shadow-sm backdrop-blur"
                >
                  <stat.icon className="h-4 w-4 text-tomato" aria-hidden="true" />
                  <div className="mt-3 truncate text-lg font-black leading-none">{statValues[index]}</div>
                  <div className="mt-1 text-xs text-ink/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-md px-4 py-4 sm:px-5">
        {errorMessage && activeTab !== "upload" && (
          <div className="mb-4 rounded-md border border-tomato/25 bg-tomato/10 p-3 text-sm font-bold text-tomato">
            {errorMessage}
          </div>
        )}
        {activeTab === "upload" && (
          <JobHistoryPanel activeJobId={job?.id} jobs={jobHistory} onSelect={selectHistoryJob} />
        )}
        {activeTab === "upload" && (
          <UploadPanel
            errorMessage={errorMessage}
            file={selectedFile}
            fileName={selectedFile?.name}
            isStarting={isStarting}
            onFileChange={setSelectedFile}
            onRetentionChange={setDeleteUploadAfterAnalysis}
            onStart={startJob}
            onTrimChange={setTrim}
          />
        )}
        {activeTab === "analysis" && (
          <StatusPanel
            job={job}
            isCancelling={isCancelling}
            isReanalyzing={isReanalyzing}
            settings={analysisSettings}
            onCancel={cancelJob}
            onReanalyze={reanalyzeJob}
            onSettingsChange={setAnalysisSettings}
          />
        )}
        {activeTab === "review" && (
          <CandidateReview
            candidates={job?.candidates ?? []}
            isSaving={isSavingCandidates}
            jobId={job?.id}
            onChange={updateCandidates}
          />
        )}
        {activeTab === "output" && (
          <div className="grid gap-4">
            <ThemePicker
              customTheme={customTheme}
              selectedThemeId={selectedThemeId}
              onCustomThemeChange={setCustomTheme}
              onSelect={setSelectedThemeId}
            />
            <OutputPanel
              icons={job?.generatedIcons ?? []}
              isGenerating={isGenerating}
              jobId={job?.id}
              onGenerate={generateIcons}
            />
          </div>
        )}
        {job && (
          <button
            type="button"
            disabled={isDeleting}
            onClick={deleteJob}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-tomato/35 bg-white px-3 text-sm font-bold text-tomato transition hover:bg-tomato/5 disabled:opacity-55"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {isDeleting ? "削除中" : "録画と結果を削除"}
          </button>
        )}
      </section>

      <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-md -translate-x-1/2 border-t border-ink/10 bg-white/94 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_35px_rgba(23,23,23,0.12)] backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {mobileTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-md text-xs font-bold transition ${
                  isActive ? "bg-ink text-white" : "text-ink/62 hover:bg-paper"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <tab.icon className="h-5 w-5" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit"
  }).format(new Date(value));
}
