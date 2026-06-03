const allowedMimeTypes = new Set(["video/mp4", "video/quicktime", "video/x-m4v"]);
const allowedExtensions = new Set([".mp4", ".mov", ".m4v"]);

export const maxUploadBytes = 500 * 1024 * 1024;

export type UploadFileInfo = {
  name: string;
  size: number;
  type: string;
};

export type UploadValidationResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
    };

export function getUploadFileExtension(fileName: string) {
  const dotIndex = fileName.lastIndexOf(".");

  if (dotIndex === -1) {
    return "";
  }

  return fileName.slice(dotIndex).toLowerCase();
}

export function validateUploadFile(file: UploadFileInfo): UploadValidationResult {
  const extension = getUploadFileExtension(file.name);

  if (!allowedMimeTypes.has(file.type) || !allowedExtensions.has(extension)) {
    return {
      ok: false,
      message: "mp4 / mov / m4v の動画ファイルを選択してください。"
    };
  }

  if (file.size > maxUploadBytes) {
    return {
      ok: false,
      message: "動画ファイルは 500MB 以下にしてください。"
    };
  }

  return { ok: true };
}
