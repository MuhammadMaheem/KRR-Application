import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch
beforeEach(() => {
  global.fetch = vi.fn();
});

describe("API Client", () => {
  it("throws on non-ok response", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: "Error" }),
    });

    const { default: client } = await import("../api/client");
    await expect(client.get("/test")).rejects.toThrow("Error");
  });

  it("returns JSON on success", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: "test" }),
    });

    const { default: client } = await import("../api/client");
    const res = await client.get("/test");
    expect(res.data).toBe("test");
  });
});
