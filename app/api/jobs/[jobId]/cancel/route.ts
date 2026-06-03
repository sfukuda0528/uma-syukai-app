import { NextResponse } from "next/server";
import { jobStore } from "@/lib/jobs/store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  const job = await jobStore.get(jobId);

  if (!job) {
    return NextResponse.json({ error: "ジョブが見つかりません。" }, { status: 404 });
  }

  if (!["queued", "extracting_frames", "running_ocr"].includes(job.status)) {
    return NextResponse.json({ error: "実行中のジョブではありません。" }, { status: 400 });
  }

  if (job.workerPid) {
    try {
      process.kill(job.workerPid);
    } catch {
      // プロセス終了済みでも、ユーザー操作としてはキャンセル状態へ進める。
    }
  }

  const updated = await jobStore.update(jobId, {
    errorMessage: "ユーザー操作により解析をキャンセルしました。",
    status: "cancelled"
  });

  return NextResponse.json({ job: updated });
}
