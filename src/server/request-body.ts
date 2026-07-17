export const LARGE_REVIEW_REQUEST_BYTES = 4 * 1024 * 1024;
export const DESTRUCTIVE_CONFIRMATION_REQUEST_BYTES = 1024;

export type SafeRequestBodyErrorCode =
  | "REQUEST_BODY_MISSING"
  | "REQUEST_BODY_TOO_LARGE"
  | "REQUEST_BODY_INVALID_JSON";

export class SafeRequestBodyError extends Error {
  readonly code: SafeRequestBodyErrorCode;
  readonly status: 400 | 413;

  constructor(code: SafeRequestBodyErrorCode) {
    super(code === "REQUEST_BODY_TOO_LARGE"
      ? "The request body exceeds the approved size limit."
      : "The request body is not valid JSON.");
    this.name = "SafeRequestBodyError";
    this.code = code;
    this.status = code === "REQUEST_BODY_TOO_LARGE" ? 413 : 400;
  }
}

function declaredContentLength(request: Request) {
  const raw = request.headers.get("content-length");
  if (raw === null) return null;
  if (!/^\d+$/.test(raw)) throw new SafeRequestBodyError("REQUEST_BODY_INVALID_JSON");
  return Number(raw);
}

export async function readBoundedJson(
  request: Request,
  maximumBytes: number,
): Promise<unknown> {
  const contentLength = declaredContentLength(request);
  if (contentLength !== null && contentLength > maximumBytes) {
    throw new SafeRequestBodyError("REQUEST_BODY_TOO_LARGE");
  }
  if (!request.body) throw new SafeRequestBodyError("REQUEST_BODY_MISSING");

  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let totalBytes = 0;
  let text = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maximumBytes) {
        await reader.cancel();
        throw new SafeRequestBodyError("REQUEST_BODY_TOO_LARGE");
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch (error) {
    if (error instanceof SafeRequestBodyError) throw error;
    throw new SafeRequestBodyError("REQUEST_BODY_INVALID_JSON");
  }

  if (!text.trim()) throw new SafeRequestBodyError("REQUEST_BODY_MISSING");

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new SafeRequestBodyError("REQUEST_BODY_INVALID_JSON");
  }
}
