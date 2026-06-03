import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createUploadJob } from "./create-upload-job";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "home-icon-upload-"));
});

afterEach(async () => {
  await rm(root, { force: true, recursive: true });
});

describe("createUploadJob", () => {
  it("saves a valid video upload and creates a queued analysis job", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "Home Screen.MP4", {
      type: "video/mp4"
    });

    const job = await createUploadJob(file, {
      artifactsDir: path.join(root, "artifacts"),
      createId: () => "job_fixed",
      uploadsDir: path.join(root, "uploads")
    });

    expect(job).toMatchObject({
      id: "job_fixed",
      originalFileName: "Home Screen.MP4",
      uploadFileName: "job_fixed.mp4",
      status: "queued"
    });
    await expect(access(path.join(root, "uploads", "job_fixed.mp4"))).resolves.toBeUndefined();
    await expect(
      readFile(path.join(root, "artifacts", "jobs", "job_fixed.json"), "utf8")
    ).resolves.toContain('"id": "job_fixed"');
  });

  it("stores an optional trim range for the worker", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "Home Screen.MP4", {
      type: "video/mp4"
    });

    const job = await createUploadJob(file, {
      artifactsDir: path.join(root, "artifacts"),
      createId: () => "job_trimmed",
      trimEndSeconds: 18.75,
      trimStartSeconds: 4.5,
      uploadsDir: path.join(root, "uploads")
    });

    expect(job.trim).toEqual({
      endSeconds: 18.75,
      startSeconds: 4.5
    });
  });

  it("rejects trim ranges where the end is before the start", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "Home Screen.MP4", {
      type: "video/mp4"
    });

    await expect(
      createUploadJob(file, {
        artifactsDir: path.join(root, "artifacts"),
        createId: () => "job_bad_trim",
        trimEndSeconds: 3,
        trimStartSeconds: 5,
        uploadsDir: path.join(root, "uploads")
      })
    ).rejects.toThrow("トリミング終了位置は開始位置より後にしてください。");
  });

  it("rejects invalid uploads before writing files", async () => {
    const file = new File(["not a movie"], "notes.txt", {
      type: "text/plain"
    });

    await expect(
      createUploadJob(file, {
        artifactsDir: path.join(root, "artifacts"),
        createId: () => "job_invalid",
        uploadsDir: path.join(root, "uploads")
      })
    ).rejects.toThrow("mp4 / mov / m4v の動画ファイルを選択してください。");
  });
});
