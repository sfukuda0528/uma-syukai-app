import { existsSync } from "node:fs";
import path from "node:path";

export function getPythonCandidates(env: NodeJS.ProcessEnv = process.env) {
  const candidates: string[] = [];

  if (env.LOCALAPPDATA) {
    candidates.push(path.join(env.LOCALAPPDATA, "Python", "bin", "python.exe"));
    candidates.push(path.join(env.LOCALAPPDATA, "Python", "bin", "python3.exe"));
  }

  candidates.push("python");
  candidates.push("python3");

  return candidates;
}

export function selectPythonExecutable(
  candidates = getPythonCandidates(),
  canExecute: (candidate: string) => boolean = existsSync
) {
  return candidates.find((candidate) => canExecute(candidate)) ?? "python";
}
