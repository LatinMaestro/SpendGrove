import { describe, expect, it } from "vitest";
import {
  DESTRUCTIVE_CONFIRMATION_REQUEST_BYTES,
  LARGE_REVIEW_REQUEST_BYTES,
  readBoundedJson,
} from "@/src/server/request-body";

function streamingRequest(chunks: string[], contentLength?: number) {
  const encoder = new TextEncoder();
  return new Request("https://spendgrove.invalid/api/account/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(contentLength === undefined ? {} : { "Content-Length": String(contentLength) }),
    },
    body: new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    }),
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

describe("bounded JSON request handling", () => {
  it("reads valid JSON without retaining request-specific evidence", async () => {
    const request = streamingRequest(['{"confirmation":"DELETE"}']);
    await expect(readBoundedJson(request, DESTRUCTIVE_CONFIRMATION_REQUEST_BYTES))
      .resolves.toEqual({ confirmation: "DELETE" });
  });

  it("rejects a declared oversized request before parsing", async () => {
    const request = streamingRequest(["{}"], LARGE_REVIEW_REQUEST_BYTES + 1);
    await expect(readBoundedJson(request, LARGE_REVIEW_REQUEST_BYTES))
      .rejects.toMatchObject({
        code: "REQUEST_BODY_TOO_LARGE",
        status: 413,
      });
  });

  it("rejects a streamed oversized request when content length is absent", async () => {
    const request = streamingRequest(["12345", "67890"]);
    await expect(readBoundedJson(request, 8))
      .rejects.toMatchObject({
        code: "REQUEST_BODY_TOO_LARGE",
        status: 413,
      });
  });

  it("rejects missing and malformed JSON using safe reason codes", async () => {
    await expect(readBoundedJson(streamingRequest(["not-json"]), 64))
      .rejects.toMatchObject({ code: "REQUEST_BODY_INVALID_JSON", status: 400 });

    const missing = new Request("https://spendgrove.invalid/api/account/test", { method: "POST" });
    await expect(readBoundedJson(missing, 64))
      .rejects.toMatchObject({ code: "REQUEST_BODY_MISSING", status: 400 });
  });

  it("keeps large review payloads below the Vercel function ceiling and destructive confirmation narrow", () => {
    expect(LARGE_REVIEW_REQUEST_BYTES).toBe(4 * 1024 * 1024);
    expect(DESTRUCTIVE_CONFIRMATION_REQUEST_BYTES).toBe(1024);
  });
});
