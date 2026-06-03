import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AppCandidate } from "@/lib/schemas/candidates";
import { generateIconArtifacts } from "./icon-generator";

let root: string;

const confirmedCandidates: AppCandidate[] = [
  {
    id: "mail",
    rawText: "Mail",
    displayName: "メール App",
    confidence: 0.92,
    frame: 12,
    confirmed: true,
    status: "confirmed"
  },
  {
    id: "calendar",
    rawText: "Calendar",
    displayName: "Calendar",
    confidence: 0.86,
    frame: 15,
    confirmed: true,
    status: "edited"
  }
];

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "home-icon-studio-icons-"));
});

afterEach(async () => {
  await rm(root, { force: true, recursive: true });
});

describe("generateIconArtifacts", () => {
  it("writes 1024px png files and returns downloadable artifact metadata", async () => {
    const icons = await generateIconArtifacts({
      artifactsDir: path.join(root, "artifacts"),
      candidates: confirmedCandidates,
      jobId: "job_123",
      theme: {
        id: "paper-ink",
        name: "Paper Ink",
        description: "test",
        palette: ["#f7f4ec", "#171717", "#d85c3a"]
      }
    });

    expect(icons).toHaveLength(2);
    expect(icons[0]).toMatchObject({
      id: "icon_mail",
      candidateId: "mail",
      displayName: "メール App",
      fileName: "mail-app.png",
      themeId: "paper-ink"
    });

    const bytes = await readFile(icons[0].path);
    expect(bytes.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  });

  it("requires at least one confirmed candidate", async () => {
    await expect(
      generateIconArtifacts({
        artifactsDir: path.join(root, "artifacts"),
        candidates: [],
        jobId: "job_123",
        theme: {
          id: "paper-ink",
          name: "Paper Ink",
          description: "test",
          palette: ["#f7f4ec", "#171717", "#d85c3a"]
        }
      })
    ).rejects.toThrow("生成する確認済み候補がありません。");
  });
});
