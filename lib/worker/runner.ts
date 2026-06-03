import { spawn } from "node:child_process";
import path from "node:path";
import { jobStore } from "@/lib/jobs/store";
import { getPythonWorkerEnv, selectPythonExecutable } from "./python";

export function startAnalysisWorker(jobId: string) {
  const scriptPath = path.join(process.cwd(), "worker", "run_analysis.py");
  const child = spawn(selectPythonExecutable(), [scriptPath, "--job-id", jobId], {
    cwd: process.cwd(),
    detached: true,
    env: getPythonWorkerEnv(),
    stdio: "ignore",
    windowsHide: true
  });

  child.once("error", (error) => {
    void jobStore.update(jobId, {
      errorMessage: error.message,
      status: "failed"
    });
  });

  if (child.pid) {
    void jobStore.update(jobId, {
      workerPid: child.pid
    });
  }

  child.unref();
}
