import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function getPythonCandidates() {
  const candidates = [];

  if (process.env.LOCALAPPDATA) {
    candidates.push(path.join(process.env.LOCALAPPDATA, "Python", "bin", "python.exe"));
    candidates.push(path.join(process.env.LOCALAPPDATA, "Python", "bin", "python3.exe"));
  }

  candidates.push("python");
  candidates.push("python3");

  return candidates;
}

function canRun(candidate) {
  const result = spawnSync(candidate, ["--version"], {
    encoding: "utf8",
    shell: false
  });

  return result.status === 0;
}

const python = getPythonCandidates().find((candidate) => {
  if (candidate.includes(path.sep) && !existsSync(candidate)) {
    return false;
  }

  return canRun(candidate);
});

if (!python) {
  console.error("Python executable was not found.");
  process.exit(1);
}

const result = spawnSync(python, ["-m", "unittest", "discover", "worker"], {
  env: {
    ...process.env,
    PYTHONIOENCODING: "utf-8",
    PYTHONUTF8: "1"
  },
  stdio: "inherit",
  shell: false
});

process.exit(result.status ?? 1);
