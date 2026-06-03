import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AnalysisJob } from "./types";
import { deleteJobFiles } from "./delete-job";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "home-icon-studio-delete-"));
});

afterEach(async () => {
  await rm(root, { force: true, recursive: true });
});

describe("deleteJobFiles", () => {
  it("deletes upload, temporary files, generated icons, and job metadata inside storage roots", async () => {
    const uploadsDir = path.join(root, "uploads");
    const tmpDir = path.join(root, "tmp");
    const artifactsDir = path.join(root, "artifacts");
    const uploadPath = path.join(uploadsDir, "job_123.mp4");
    const framePath = path.join(tmpDir, "job_123", "frames", "frame.jpg");
    const iconPath = path.join(artifactsDir, "icons", "job_123", "mail.png");
    const jobPath = path.join(artifactsDir, "jobs", "job_123.json");

    await mkdir(path.dirname(framePath), { recursive: true });
    await mkdir(path.dirname(iconPath), { recursive: true });
    await mkdir(path.dirname(jobPath), { recursive: true });
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(uploadPath, "upload");
    await writeFile(framePath, "frame");
    await writeFile(iconPath, "icon");
    await writeFile(jobPath, "job");

    const job: AnalysisJob = {
      id: "job_123",
      candidates: [],
      createdAt: new Date().toISOString(),
      fileSize: 1,
      generatedIcons: [
        {
          id: "icon_mail",
          candidateId: "mail",
          createdAt: new Date().toISOString(),
          displayName: "Mail",
          fileName: "mail.png",
          path: iconPath,
          themeId: "paper-ink"
        }
      ],
      mimeType: "video/mp4",
      originalFileName: "home.mp4",
      status: "ready",
      updatedAt: new Date().toISOString(),
      uploadFileName: "job_123.mp4",
      uploadPath
    };

    await deleteJobFiles(job, { artifactsDir, tmpDir, uploadsDir });

    await expect(readFile(uploadPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(framePath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(iconPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(jobPath, "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("refuses to delete paths outside configured storage roots", async () => {
    const job: AnalysisJob = {
      id: "job_123",
      candidates: [],
      createdAt: new Date().toISOString(),
      fileSize: 1,
      mimeType: "video/mp4",
      originalFileName: "home.mp4",
      status: "ready",
      updatedAt: new Date().toISOString(),
      uploadFileName: "job_123.mp4",
      uploadPath: path.join(root, "outside.mp4")
    };

    await expect(
      deleteJobFiles(job, {
        artifactsDir: path.join(root, "artifacts"),
        tmpDir: path.join(root, "tmp"),
        uploadsDir: path.join(root, "uploads")
      })
    ).rejects.toThrow("削除対象が保存領域の外にあります。");
  });
});
