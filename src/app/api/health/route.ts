import { connection } from "next/server";
import { pingDb } from "@/server/dal/health";

export async function GET() {
  // Luôn chạy lúc request, không prerender.
  await connection();
  const dbUp = await pingDb();
  return Response.json(
    { status: dbUp ? "ok" : "error", db: dbUp ? "up" : "down" },
    { status: dbUp ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
