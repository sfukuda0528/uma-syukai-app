import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createStoredZipArchive } from "./zip-archive";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "home-icon-studio-zip-"));
});

afterEach(async () => {
  await rm(root, { force: true, recursive: true });
});

describe("createStoredZipArchive", () => {
  it("writes a zip containing generated icons and setup notes", async () => {
    const iconPath = path.join(root, "mail.png");
    await writeFile(iconPath, Buffer.from([1, 2, 3, 4]));

    const archive = await createStoredZipArchive({
      artifactsDir: path.join(root, "artifacts"),
      icons: [
        {
          id: "icon_mail",
          candidateId: "mail",
          createdAt: "2026-06-03T00:00:00.000Z",
          displayName: "Mail",
          fileName: "mail.png",
          path: iconPath,
          themeId: "paper-ink"
        }
      ],
      jobId: "job_123"
    });

    expect(archive).toMatchObject({
      fileName: "home-icon-studio-job_123.zip"
    });

    const bytes = await readFile(archive.path);
    expect(bytes.subarray(0, 4).toString("ascii")).toBe("PK\u0003\u0004");
    expect(bytes.toString("utf8")).toContain("icons/mail.png");
    expect(bytes.toString("utf8")).toContain("README.txt");
    expect(bytes.toString("utf8")).toContain("Shortcut setup checklist");
    expect(bytes.toString("utf8")).toContain("[ ] Mail");
    expect(bytes.toString("utf8")).toContain("Create a shortcut with the Open App action for Mail.");
  });

  it("requires generated icons before creating a zip", async () => {
    await expect(
      createStoredZipArchive({
        artifactsDir: path.join(root, "artifacts"),
        icons: [],
        jobId: "job_123"
      })
    ).rejects.toThrow("ZIP 化する生成済みアイコンがありません。");
  });
});
