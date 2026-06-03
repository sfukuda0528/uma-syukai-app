import { NextResponse } from "next/server";
import themes from "@/data/default-icon-themes.json";
import { generateIconArtifacts, type IconTheme } from "@/lib/icons/icon-generator";
import { getConfirmedCandidates } from "@/lib/jobs/candidate-review";
import { jobStore } from "@/lib/jobs/store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    jobId: string;
  }>;
};

type RequestBody = {
  theme?: IconTheme;
  themeId?: string;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;
    const job = await jobStore.get(jobId);

    if (!job) {
      return NextResponse.json({ error: "ジョブが見つかりません。" }, { status: 404 });
    }

    const body = (await request.json()) as RequestBody;
    const theme = normalizeTheme(body.theme) ?? (themes as IconTheme[]).find((item) => item.id === body.themeId) ?? (themes as IconTheme[])[0];
    const generatedIcons = await generateIconArtifacts({
      candidates: getConfirmedCandidates(job.candidates),
      jobId,
      theme
    });
    const updated = await jobStore.update(jobId, { generatedIcons });

    return NextResponse.json({ job: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "アイコンを生成できませんでした。" },
      { status: 400 }
    );
  }
}

function normalizeTheme(theme: IconTheme | undefined) {
  if (!theme || !Array.isArray(theme.palette)) {
    return undefined;
  }

  const palette = theme.palette.filter((color) => /^#[0-9a-f]{6}$/i.test(color)).slice(0, 3);
  if (palette.length < 3) {
    return undefined;
  }

  return {
    id: theme.id || "custom",
    name: theme.name || "Custom",
    description: theme.description || "User edited theme",
    palette
  };
}
