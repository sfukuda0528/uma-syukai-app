import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createJobStore } from "./store";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "home-icon-studio-"));
});

afterEach(async () => {
  await rm(root, { force: true, recursive: true });
});

describe("createJobStore", () => {
  it("creates a queued job JSON file with upload metadata", async () => {
    const store = createJobStore({
      artifactsDir: path.join(root, "artifacts")
    });

    const job = await store.create({
      id: "job_abc123",
      originalFileName: "home.mov",
      uploadPath: path.join(root, "uploads", "job_abc123.mov"),
      uploadFileName: "job_abc123.mov",
      fileSize: 1024,
      mimeType: "video/quicktime"
    });

    expect(job).toMatchObject({
      id: "job_abc123",
      status: "queued",
      candidates: [],
      originalFileName: "home.mov",
      uploadFileName: "job_abc123.mov",
      fileSize: 1024,
      mimeType: "video/quicktime"
    });

    const stored = JSON.parse(
      await readFile(path.join(root, "artifacts", "jobs", "job_abc123.json"), "utf8")
    );
    expect(stored.id).toBe("job_abc123");
  });

  it("updates a job while preserving created metadata", async () => {
    const store = createJobStore({
      artifactsDir: path.join(root, "artifacts")
    });
    await store.create({
      id: "job_def456",
      originalFileName: "home.mp4",
      uploadPath: path.join(root, "uploads", "job_def456.mp4"),
      uploadFileName: "job_def456.mp4",
      fileSize: 2048,
      mimeType: "video/mp4"
    });

    const updated = await store.update("job_def456", {
      status: "running_ocr",
      errorMessage: undefined
    });

    expect(updated.status).toBe("running_ocr");
    expect(updated.createdAt).toBeTruthy();
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(updated.createdAt).getTime()
    );
  });

  it("returns null for a missing job instead of throwing", async () => {
    const store = createJobStore({
      artifactsDir: path.join(root, "artifacts")
    });

    await expect(store.get("missing")).resolves.toBeNull();
  });
});
