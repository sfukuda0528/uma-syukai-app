import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { createStoredZipArchive } from "@/lib/icons/zip-archive";
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

  try {
    const archive = await createStoredZipArchive({
      icons: job.generatedIcons ?? [],
      jobId
    });
    const bytes = await readFile(archive.path);

    return new NextResponse(bytes, {
      headers: {
        "Content-Disposition": `attachment; filename="${archive.fileName}"`,
        "Content-Type": "application/zip"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ZIP を生成できませんでした。" },
      { status: 400 }
    );
  }
}
