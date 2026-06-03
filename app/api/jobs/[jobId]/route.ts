import { NextResponse } from "next/server";
import { deleteJobFiles } from "@/lib/jobs/delete-job";
import { jobStore } from "@/lib/jobs/store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  const job = await jobStore.get(jobId);

  if (!job) {
    return NextResponse.json({ error: "ジョブが見つかりません。" }, { status: 404 });
  }

  return NextResponse.json({ job });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  const job = await jobStore.get(jobId);

  if (!job) {
    return NextResponse.json({ error: "ジョブが見つかりません。" }, { status: 404 });
  }

  try {
    await deleteJobFiles(job);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ジョブを削除できませんでした。" },
      { status: 400 }
    );
  }
}
