import { beforeEach, describe, expect, it, vi } from "vitest";

const pingDb = vi.fn<() => Promise<boolean>>();

vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("@/server/dal/health", () => ({ pingDb: () => pingDb() }));

const { GET } = await import("./route");

describe("GET /api/health", () => {
  beforeEach(() => pingDb.mockReset());

  it("trả 200 khi DB hoạt động", async () => {
    pingDb.mockResolvedValue(true);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ status: "ok", db: "up" });
  });

  it("trả 503 khi DB không kết nối được", async () => {
    pingDb.mockResolvedValue(false);
    const res = await GET();
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ status: "error", db: "down" });
  });
});
