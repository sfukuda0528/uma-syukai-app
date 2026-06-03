import { NextResponse } from "next/server";
import { prepareJobForReanalysis, type ReanalysisSettingsInput } from "@/lib/jobs/reanalysis";
import { jobStore } from "@/lib/jobs/store";
import { startAnalysisWorker } from "@/lib/worker/runner";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

type RequestBody = {
  settings?: ReanalysisSettingsInput;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;
    const job = await jobStore.get(jobId);

    if (!job) {
      return NextResponse.json({ error: "ジョブが見つかりません。" }, { status: 404 });
    }
    if (job.uploadDeletedAt) {
      return NextResponse.json(
        { error: "アップロード録画は削除済みです。再解析するには再アップロードしてください。" },
        { status: 400 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as RequestBody;
    const updated = await jobStore.update(jobId, prepareJobForReanalysis(job, body.settings));
    startAnalysisWorker(jobId);

    return NextResponse.json({ job: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "再解析を開始できませんでした。" },
      { status: 400 }
    );
  }
}
