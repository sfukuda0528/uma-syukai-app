import { NextResponse } from "next/server";
import { applyCandidateChanges, type CandidateChange } from "@/lib/jobs/candidate-review";
import { jobStore } from "@/lib/jobs/store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

type RequestBody = {
  changes?: CandidateChange[];
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;
    const job = await jobStore.get(jobId);

    if (!job) {
      return NextResponse.json({ error: "ジョブが見つかりません。" }, { status: 404 });
    }

    const body = (await request.json()) as RequestBody;
    if (!Array.isArray(body.changes)) {
      return NextResponse.json({ error: "候補の更新内容が不正です。" }, { status: 400 });
    }

    const candidates = applyCandidateChanges(job.candidates, body.changes);
    const updated = await jobStore.update(jobId, { candidates });

    return NextResponse.json({ job: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "候補を更新できませんでした。" },
      { status: 400 }
    );
  }
}
