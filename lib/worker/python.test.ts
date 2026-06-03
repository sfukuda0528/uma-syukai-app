import { describe, expect, it } from "vitest";
import { getPythonCandidates, selectPythonExecutable } from "./python";

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
