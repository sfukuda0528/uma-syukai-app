import { NextResponse } from "next/server";
import { createUploadJob } from "@/lib/jobs/create-upload-job";
import { startAnalysisWorker } from "@/lib/worker/runner";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const trimStartSeconds = parseOptionalNumber(formData.get("trimStartSeconds"));
    const trimEndSeconds = parseOptionalNumber(formData.get("trimEndSeconds"));

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "動画ファイルを選択してください。" },
        { status: 400 }
      );
    }

    const job = await createUploadJob(file, {
      trimEndSeconds,
      trimStartSeconds
    });
    startAnalysisWorker(job.id);

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "アップロードに失敗しました。"
      },
      { status: 400 }
    );
  }
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}
