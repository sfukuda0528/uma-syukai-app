import { describe, expect, it } from "vitest";
import { readJsonResponse } from "./json-response";

describe("readJsonResponse", () => {
  it("parses JSON responses", async () => {
    const response = new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });

    await expect(readJsonResponse<{ ok: boolean }>(response)).resolves.toEqual({ ok: true });
  });

  it("rejects HTML responses with a clear message instead of a JSON parser error", async () => {
    const response = new Response("<!DOCTYPE html><html><body>Error</body></html>", {
      headers: { "Content-Type": "text/html; charset=utf-8" },
      status: 500,
      statusText: "Internal Server Error"
    });

    await expect(readJsonResponse(response)).rejects.toThrow(
      "API が JSON ではなく HTML を返しました。開いているポートまたは開発サーバーを確認してください。"
    );
  });

  it("uses API error messages from JSON error payloads", async () => {
    const response = new Response(JSON.stringify({ error: "ジョブが見つかりません。" }), {
      headers: { "Content-Type": "application/json" },
      status: 404,
      statusText: "Not Found"
    });

    await expect(readJsonResponse(response)).rejects.toThrow("ジョブが見つかりません。");
  });
});
