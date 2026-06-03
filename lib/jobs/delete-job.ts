import { rm } from "node:fs/promises";
import path from "node:path";
import { storagePaths } from "../storage/paths";
import type { AnalysisJob } from "./types";

type DeleteJobFilesOptions = {
  artifactsDir?: string;
  tmpDir?: string;
  uploadsDir?: string;
};

export async function deleteJobFiles(job: AnalysisJob, options: DeleteJobFilesOptions = {}) {
  const artifactsDir = options.artifactsDir ?? storagePaths.artifacts;
  const tmpDir = options.tmpDir ?? storagePaths.tmp;
  const uploadsDir = options.uploadsDir ?? storagePaths.uploads;

  const uploadPath = assertInsideRoot(job.uploadPath, uploadsDir);
  const jobTmpDir = assertInsideRoot(path.join(tmpDir, job.id), tmpDir);
  const jobIconsDir = assertInsideRoot(path.join(artifactsDir, "icons", job.id), artifactsDir);
  const jobMetadataPath = assertInsideRoot(path.join(artifactsDir, "jobs", `${job.id}.json`), artifactsDir);

  for (const icon of job.generatedIcons ?? []) {
    assertInsideRoot(icon.path, artifactsDir);
  }

  await Promise.all([
    removePath(uploadPath),
    removePath(jobTmpDir),
    removePath(jobIconsDir),
    removePath(jobMetadataPath)
  ]);
}

function assertInsideRoot(target: string, root: string) {
  const resolvedTarget = path.resolve(target);
  const resolvedRoot = path.resolve(root);
  const relative = path.relative(resolvedRoot, resolvedTarget);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("削除対象が保存領域の外にあります。");
  }

  return resolvedTarget;
}

async function removePath(target: string) {
  await rm(target, { force: true, recursive: true });
}
