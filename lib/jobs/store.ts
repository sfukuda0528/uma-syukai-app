import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { storagePaths } from "../storage/paths";
import type { AnalysisJob } from "./types";

type CreateJobInput = {
  id: string;
  uploadPath: string;
  uploadFileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  trim?: AnalysisJob["trim"];
};

type JobStoreOptions = {
  artifactsDir?: string;
};

type JobPatch = Partial<Omit<AnalysisJob, "id" | "createdAt">>;

export function createJobStore(options: JobStoreOptions = {}) {
  const artifactsDir = options.artifactsDir ?? storagePaths.artifacts;
  const jobsDir = path.join(artifactsDir, "jobs");

  function getJobPath(id: string) {
    return path.join(jobsDir, `${id}.json`);
  }

  async function persist(job: AnalysisJob) {
    await mkdir(jobsDir, { recursive: true });
    await writeFile(getJobPath(job.id), `${JSON.stringify(job, null, 2)}\n`, "utf8");
  }

  return {
    async create(input: CreateJobInput) {
      const now = new Date().toISOString();
      const job: AnalysisJob = {
        id: input.id,
        status: "queued",
        uploadPath: input.uploadPath,
        uploadFileName: input.uploadFileName,
        originalFileName: input.originalFileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        createdAt: now,
        updatedAt: now,
        candidates: [],
        ...(input.trim ? { trim: input.trim } : {})
      };

      await persist(job);

      return job;
    },

    async get(id: string) {
      try {
        const content = await readFile(getJobPath(id), "utf8");
        return JSON.parse(content) as AnalysisJob;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          return null;
        }

        throw error;
      }
    },

    async update(id: string, patch: JobPatch) {
      const current = await this.get(id);

      if (!current) {
        throw new Error(`Job not found: ${id}`);
      }

      const next: AnalysisJob = {
        ...current,
        ...patch,
        updatedAt: new Date().toISOString()
      };

      await persist(next);

      return next;
    }
  };
}

export const jobStore = createJobStore();
