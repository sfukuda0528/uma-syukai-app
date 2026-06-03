import { NextResponse } from "next/server";
import { createUploadJob } from "@/lib/jobs/create-upload-job";
import { jobStore } from "@/lib/jobs/store";
import { startAnalysisWorker } from "@/lib/worker/runner";

export const runtime = "nodejs";

export async function GET() {
  const jobs = await jobStore.list();
  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const trimStartSeconds = parseOptionalNumber(formData.get("trimStartSeconds"));
    const trimEndSeconds = parseOptionalNumber(formData.get("trimEndSeconds"));
    const deleteUploadAfterAnalysis = parseOptionalBoolean(formData.get("deleteUploadAfterAnalysis")) ?? true;

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "動画ファイルを選択してください。" },
        { status: 400 }
      );
    }

    const job = await createUploadJob(file, {
      trimEndSeconds,
      trimStartSeconds,
      deleteUploadAfterAnalysis
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

function parseOptionalBoolean(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  return value === "true";
}

function parseOptionalNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}
