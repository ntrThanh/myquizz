import { ObjectId } from "mongodb";
import { run, withDb } from "./connect";

// Đổi role người dùng từ server: `npm run user:set-role -- <email> <user|editor|admin>`.
// Đây là cách duy nhất tạo admin đầu tiên; trên web chỉ admin mới đổi được role của người khác.

const ROLES = ["user", "editor", "admin"];

run(async () => {
  const [email, role] = process.argv.slice(2);
  if (!email || !role || !ROLES.includes(role)) {
    throw new Error("Cách dùng: npm run user:set-role -- <email> <user|editor|admin>");
  }
  await withDb(async (db) => {
    const user = await db.collection("users").findOne({ email: email.toLowerCase() });
    if (!user) throw new Error(`Không tìm thấy người dùng ${email}. Hãy đăng ký trên web trước.`);
    const from = user.role ?? "user";
    await db
      .collection("users")
      .updateOne({ _id: user._id }, { $set: { role, updatedAt: new Date() } });
    await db.collection("auditLogs").insertOne({
      _id: new ObjectId(),
      actorId: null,
      action: "user.setRole",
      target: { type: "user", id: user._id.toHexString() },
      meta: { from, to: role, via: "cli" },
      createdAt: new Date(),
    });
    console.log(`${email}: ${from} → ${role}`);
  });
});
