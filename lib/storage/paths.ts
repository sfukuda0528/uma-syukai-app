import path from "node:path";

export const storageRoot = process.cwd();

export const storagePaths = {
  uploads: path.join(storageRoot, "uploads"),
  tmp: path.join(storageRoot, "tmp"),
  artifacts: path.join(storageRoot, "artifacts")
} as const;

export type StorageArea = keyof typeof storagePaths;
