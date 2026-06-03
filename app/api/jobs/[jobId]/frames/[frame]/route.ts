import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { findFramePreview } from "@/lib/jobs/frame-preview";
import { jobStore } from "@/lib/jobs/store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    frame: string;
    jobId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { frame, jobId } = await context.params;
  const frameNumber = Number.parseInt(frame, 10);

  if (!Number.isInteger(frameNumber) || frameNumber <= 0) {
    return NextResponse.json({ error: "Invalid frame number." }, { status: 400 });
  }

  const job = await jobStore.get(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const preview = findFramePreview(job, frameNumber);
  if (!preview) {
    return NextResponse.json({ error: "Frame not found." }, { status: 404 });
  }

  try {
    const bytes = await readFile(preview.path);
    return new NextResponse(bytes, {
      headers: {
        "Content-Disposition": `inline; filename="frame-${preview.frame}.jpg"`,
        "Content-Type": "image/jpeg"
      }
    });
  } catch {
    return NextResponse.json({ error: "Frame file could not be read." }, { status: 404 });
  }
}
