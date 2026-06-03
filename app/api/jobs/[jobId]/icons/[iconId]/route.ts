import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { jobStore } from "@/lib/jobs/store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    iconId: string;
    jobId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { iconId, jobId } = await context.params;
  const job = await jobStore.get(jobId);

  if (!job) {
    return NextResponse.json({ error: "ジョブが見つかりません。" }, { status: 404 });
  }

  const icon = job.generatedIcons?.find((item) => item.id === iconId);
  if (!icon) {
    return NextResponse.json({ error: "生成物が見つかりません。" }, { status: 404 });
  }

  try {
    const bytes = await readFile(icon.path);
    return new NextResponse(bytes, {
      headers: {
        "Content-Disposition": `attachment; filename="${icon.fileName}"`,
        "Content-Type": "image/png"
      }
    });
  } catch {
    return NextResponse.json({ error: "生成物ファイルを読み込めませんでした。" }, { status: 404 });
  }
}
