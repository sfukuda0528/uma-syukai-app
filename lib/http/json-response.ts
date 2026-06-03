type ErrorPayload = {
  error?: unknown;
};

export async function readJsonResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(
      contentType.toLowerCase().includes("text/html") || text.trimStart().startsWith("<!DOCTYPE")
        ? "API が JSON ではなく HTML を返しました。開いているポートまたは開発サーバーを確認してください。"
        : `API が JSON ではない応答を返しました。HTTP ${response.status}`
    );
  }

  let payload: unknown;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`API の JSON 応答を読み取れませんでした。HTTP ${response.status}`);
  }

  if (!response.ok) {
    const errorMessage = readErrorMessage(payload);
    throw new Error(errorMessage ?? `API request failed. HTTP ${response.status}`);
  }

  return payload as T;
}

function readErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return undefined;
  }

  const error = (payload as ErrorPayload).error;
  return typeof error === "string" && error.trim() ? error : undefined;
}
