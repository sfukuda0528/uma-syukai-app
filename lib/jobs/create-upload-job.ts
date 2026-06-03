import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { storagePaths } from "../storage/paths";
import { getUploadFileExtension, validateUploadFile } from "../uploads/validation";
import { createJobStore } from "./store";

type CreateUploadJobOptions = {
  artifactsDir?: string;
  createId?: () => string;
  trimEndSeconds?: number;
  trimStartSeconds?: number;
  uploadsDir?: string;
};

export async function createUploadJob(file: File, options: CreateUploadJobOptions = {}) {
  const validation = validateUploadFile({
    name: file.name,
    size: file.size,
    type: file.type
  });

  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const trim = normalizeTrimRange(options.trimStartSeconds, options.trimEndSeconds);
  const id = options.createId?.() ?? `job_${randomUUID()}`;
  const extension = getUploadFileExtension(file.name);
  const uploadsDir = options.uploadsDir ?? storagePaths.uploads;
  const uploadFileName = `${id}${extension}`;
  const uploadPath = path.join(uploadsDir, uploadFileName);

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(uploadPath, Buffer.from(await file.arrayBuffer()));

  return createJobStore({
    artifactsDir: options.artifactsDir
  }).create({
    id,
    fileSize: file.size,
    mimeType: file.type,
    originalFileName: file.name,
    ...(trim ? { trim } : {}),
    uploadFileName,
    uploadPath
  });
}

function normalizeTrimRange(start?: number, end?: number) {
  const hasStart = typeof start === "number" && Number.isFinite(start) && start > 0;
  const hasEnd = typeof end === "number" && Number.isFinite(end) && end > 0;

  if (!hasStart && !hasEnd) {
    return undefined;
  }

  const startSeconds = hasStart ? roundSeconds(start) : 0;
  const endSeconds = hasEnd ? roundSeconds(end) : undefined;

  if (endSeconds !== undefined && endSeconds <= startSeconds) {
    throw new Error("トリミング終了位置は開始位置より後にしてください。");
  }

  return {
    startSeconds,
    ...(endSeconds !== undefined ? { endSeconds } : {})
  };
}

function roundSeconds(value: number) {
  return Math.round(value * 100) / 100;
}
