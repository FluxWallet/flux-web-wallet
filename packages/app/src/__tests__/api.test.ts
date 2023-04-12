import { describe, it, expect, vi, beforeEach } from "vitest";
import handler from "../pages/api/generate-calldata";

function mockReq(overrides: Record<string, unknown> = {}): any {
  return {
    method: "POST",
    headers: { "x-api-key": "test-key" },
    body: { input: { test: true } },
    ...overrides,
  };
}

function mockRes(): any {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  };
}

describe("POST /api/generate-calldata", () => {
  beforeEach(() => {
    delete process.env.API_SECRET_KEY;
    process.env.CORS_ORIGIN = "*";
  });

  it("rejects GET with 405", async () => {
    const req = mockReq({ method: "GET" });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });

  it("rejects missing API key when env is set", async () => {
    process.env.API_SECRET_KEY = "secret-key";
    const req = mockReq({ headers: {} });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  it("rejects wrong API key when env is set", async () => {
    process.env.API_SECRET_KEY = "secret-key";
    const req = mockReq({ headers: { "x-api-key": "wrong-key" } });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Unauthorized" });
  });

  it("allows request when no API_SECRET_KEY is configured", async () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).not.toHaveBeenCalledWith(401);
  });

  it("rejects missing input with 400", async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Missing circuit input" });
  });

  it("rejects oversized body with 413", async () => {
    const req = mockReq({ body: { input: { data: "x".repeat(200_000) } } });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({ error: "Request body too large" });
  });

  it("handles OPTIONS preflight", async () => {
    const req = mockReq({ method: "OPTIONS" });
    const res = mockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalled();
  });

  it("sets CORS headers on every request", async () => {
    const req = mockReq({ method: "OPTIONS" });
    const res = mockRes();

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith(
      "Access-Control-Allow-Origin",
      "*",
    );
  });
});
