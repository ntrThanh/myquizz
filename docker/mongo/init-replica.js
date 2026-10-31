// Chạy bằng mongosh (service mongo-init). Idempotent: chạy lại nhiều lần không sao.
const rsName = "rs0";
const rsHost = process.env.MONGO_RS_HOST || "mongo:27017";
const appDbName = process.env.MONGODB_DB;
const appUser = process.env.MONGO_APP_USER;
const appPassword = process.env.MONGO_APP_PASSWORD;

if (!appDbName || !appUser || !appPassword) {
  throw new Error("Thiếu MONGODB_DB / MONGO_APP_USER / MONGO_APP_PASSWORD");
}

try {
  rs.status();
  print("Replica set đã được khởi tạo.");
} catch (e) {
  if (e.codeName !== "NotYetInitialized") throw e;
  rs.initiate({ _id: rsName, members: [{ _id: 0, host: rsHost }] });
  print(`Đã khởi tạo replica set ${rsName} (${rsHost}).`);
}

while (!db.hello().isWritablePrimary) sleep(500);

// User của app chỉ có readWrite trên đúng database của app.
const appDb = db.getSiblingDB(appDbName);
const roles = [{ role: "readWrite", db: appDbName }];
if (appDb.getUser(appUser)) {
  appDb.updateUser(appUser, { pwd: appPassword, roles });
  print(`Đã cập nhật user ${appUser}.`);
} else {
  appDb.createUser({ user: appUser, pwd: appPassword, roles });
  print(`Đã tạo user ${appUser}.`);
}
