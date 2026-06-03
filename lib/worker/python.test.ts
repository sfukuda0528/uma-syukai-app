import { describe, expect, it } from "vitest";
import { getPythonCandidates, getPythonWorkerEnv, selectPythonExecutable } from "./python";

describe("getPythonCandidates", () => {
  it("includes the local Python bin path before Windows app aliases", () => {
    const candidates = getPythonCandidates({
      LOCALAPPDATA: "C:\\Users\\kyome\\AppData\\Local"
    });

    expect(candidates[0]).toBe("C:\\Users\\kyome\\AppData\\Local\\Python\\bin\\python.exe");
    expect(candidates).toContain("python");
  });
});

describe("selectPythonExecutable", () => {
  it("returns the first executable candidate", () => {
    const selected = selectPythonExecutable(["bad-python", "good-python"], (candidate) => {
      return candidate === "good-python";
    });

    expect(selected).toBe("good-python");
  });

  it("falls back to python when no candidate can be checked", () => {
    expect(selectPythonExecutable([], () => false)).toBe("python");
  });
});

describe("getPythonWorkerEnv", () => {
  it("forces UTF-8 output so Python progress characters do not fail on cp932 Windows", () => {
    const env = getPythonWorkerEnv({
      PATH: "C:\\Windows",
      PYTHONIOENCODING: "cp932"
    });

    expect(env.PATH).toBe("C:\\Windows");
    expect(env.PYTHONIOENCODING).toBe("utf-8");
    expect(env.PYTHONUTF8).toBe("1");
  });
});
