import { describe, expect, it } from "vitest";
import { getUploadFileExtension, validateUploadFile } from "./validation";

describe("validateUploadFile", () => {
  it("accepts supported home screen recording formats under the size limit", () => {
    const result = validateUploadFile({
      name: "home-screen.MP4",
      size: 12_000_000,
      type: "video/mp4"
    });

    expect(result.ok).toBe(true);
  });

  it("rejects unsupported file types", () => {
    const result = validateUploadFile({
      name: "notes.txt",
      size: 500,
      type: "text/plain"
    });

    expect(result).toEqual({
      ok: false,
      message: "mp4 / mov / m4v の動画ファイルを選択してください。"
    });
  });

  it("rejects files over the local MVP size limit", () => {
    const result = validateUploadFile({
      name: "large.mov",
      size: 501 * 1024 * 1024,
      type: "video/quicktime"
    });

    expect(result).toEqual({
      ok: false,
      message: "動画ファイルは 500MB 以下にしてください。"
    });
  });
});

describe("getUploadFileExtension", () => {
  it("normalizes supported extensions", () => {
    expect(getUploadFileExtension("capture.MOV")).toBe(".mov");
    expect(getUploadFileExtension("capture.m4v")).toBe(".m4v");
  });
});
