import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
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
  deleteUploadAfterAnalysis?: boolean;
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
        ...(input.deleteUploadAfterAnalysis !== undefined
          ? { deleteUploadAfterAnalysis: input.deleteUploadAfterAnalysis }
          : {}),
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

    async list() {
      try {
        const entries = await readdir(jobsDir, { withFileTypes: true });
        const jobs = await Promise.all(
          entries
            .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
            .map(async (entry) => {
              try {
                const content = await readFile(path.join(jobsDir, entry.name), "utf8");
                return JSON.parse(content) as AnalysisJob;
              } catch {
                return null;
              }
            })
        );

        return jobs
          .filter((job): job is AnalysisJob => job !== null)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          return [];
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
