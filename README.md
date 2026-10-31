# Quizz

Web app học từ vựng tiếng Anh: flashcard, quiz, ôn tập theo spaced repetition (SM-2), có khu quản trị. Xem [CLAUDE.md](CLAUDE.md) cho quy ước kiến trúc, bảo mật và lộ trình.

**Trạng thái:** Giai đoạn 0 xong; Giai đoạn 1 xong phần lõi — đăng ký/đăng nhập bằng email + mật khẩu, phân quyền user/editor/admin, flashcard SM-2, quiz, gõ đáp án, thống kê, khung /admin (người dùng, nhật ký). Chưa có: đăng nhập Google, xác minh email (xem "Ghi chú và quyết định").

## Yêu cầu

- Node.js 24 LTS trở lên (`.nvmrc`)
- Docker + Docker Compose v2
- `openssl` (tạo keyfile, mật khẩu)

## Cài đặt lần đầu (dev)

```bash
npm install
cp .env.example .env               # rồi thay các mật khẩu change-me-* (dùng `openssl rand -hex 24`)
./docker/scripts/gen-keyfile.sh    # keyfile cho replica set (docker/mongo/keyfile, không commit)
docker compose -f compose.yml -f compose.dev.yml up -d   # Mongo + Redis
npm run db:migrate
npm run db:seed                    # dữ liệu mẫu: 2 khóa học, 34 từ
npm run dev                        # http://localhost:3000
```

Sau đó đăng ký tài khoản trên web, rồi nâng thành admin bằng CLI (không có cách nào tự nâng quyền qua web):

```bash
npm run user:set-role -- ban@example.com admin
```

`MONGO_APP_PASSWORD` trong `.env` phải trùng với mật khẩu trong `MONGODB_URI`.

`docker compose up` lần đầu sẽ:

1. Chạy `mongo` với `--replSet rs0 --keyFile` và tạo user root (chỉ dùng để khởi tạo).
2. Chạy `mongo-init` một lần: `rs.initiate` và tạo user của app chỉ có quyền `readWrite` trên `MONGODB_DB`. Chạy lại không sao (idempotent); đổi `MONGO_APP_PASSWORD` rồi `up` lại là mật khẩu được cập nhật.

Ở dev, Mongo mở cổng `127.0.0.1:27017`. URI dùng `directConnection=true` vì host trong replica set là `mongo:27017`, chỉ phân giải được trong mạng Docker.

## Lệnh

| Lệnh                              | Việc                                                             |
| --------------------------------- | ---------------------------------------------------------------- |
| `npm run dev`                     | Dev server                                                       |
| `npm run lint` / `npm run format` | ESLint / Prettier                                                |
| `npm run typecheck`               | Sinh type route của Next rồi `tsc --noEmit`                      |
| `npm test`                        | Vitest                                                           |
| `npm run build`                   | Build production                                                 |
| `npm run db:migrate`              | Chạy migration chưa áp dụng                                      |
| `npm run db:migrate:status`       | Xem trạng thái migration                                         |
| `npm run db:migrate:down`         | Quay lại một migration gần nhất                                  |
| `npm run build:migrate`           | Bundle CLI migration thành `dist/migrate.cjs` (dùng trong image) |

Test tích hợp (migration runner, ma trận quyền DAL, luồng học) chỉ chạy khi có `MONGODB_TEST_URI`, và cần replica set vì DAL dùng transaction. Mỗi file test dùng một DB `quizz_test_*` riêng rồi xóa đi, nên user trong URI cần quyền tạo/xóa DB — ở dev dùng tài khoản root (không dùng user của app):

```bash
MONGODB_TEST_URI="mongodb://root:<MONGO_ROOT_PASSWORD>@127.0.0.1:27017/?directConnection=true" npm test
```

## Migration

- Mỗi migration là một file `migrations/scripts/NNNN-ten.ts` export `{ id, up, down? }`, và **phải được thêm vào cuối mảng** trong `migrations/index.ts` (liệt kê tường minh để bundle được vào image).
- `up` phải idempotent. Trạng thái lưu ở collection `_migrations`; collection `_migrations_lock` chặn hai tiến trình chạy cùng lúc (lock quá 15 phút được coi là chết và bị chiếm lại).
- Trong Docker, service `migrate` chạy `node migrate.cjs up` bằng chính image của app, sau `mongo-init` và trước `app`.

## Docker

```bash
# Chạy cả stack trong Docker ở máy dev (app build tại chỗ, Caddy ở https://localhost)
docker compose -f compose.yml -f compose.dev.yml --profile full up -d --build

# Production (trên server, file .env đặt ngoài repo)
docker compose -f compose.yml -f compose.prod.yml pull
docker compose -f compose.yml -f compose.prod.yml up -d
```

- `docker/Dockerfile`: 3 stage, output `standalone`, chạy `node server.js` bằng user `node`, có `HEALTHCHECK` gọi `/api/health`.
- `compose.yml`: `mongo`, `mongo-init`, `migrate`, `app`, `caddy`. Mạng `backend` là `internal`; chỉ Caddy mở 80/443. Mongo không publish cổng.
- `compose.prod.yml`: `restart: unless-stopped`, giới hạn CPU/RAM, log xoay vòng (10 MB × 5).
- Biến cho Compose (`APP_IMAGE`, `APP_DOMAIN`, `MONGO_*`) nằm cùng file `.env`. Xem `.env.example`.

## Trang

| Đường dẫn                                                            | Ai vào được                                   |
| -------------------------------------------------------------------- | --------------------------------------------- |
| `/`, `/courses`, `/courses/[slug]`                                   | Mọi người (khách chỉ thấy nội dung published) |
| `/login`, `/register`                                                | Khách (đã đăng nhập thì chuyển về `/learn`)   |
| `/learn` (thống kê), `/learn/review`, `/learn/quiz`, `/learn/typing` | Người đã đăng nhập                            |
| `/admin`                                                             | editor, admin                                 |
| `/admin/users`, `/admin/audit`                                       | admin                                         |

Phím tắt: ôn flashcard `Space` lật, `1`–`4` chấm Quên/Khó/Nhớ/Dễ; quiz `1`–`4` chọn, `Enter` câu tiếp; gõ đáp án `Enter` kiểm tra, `Enter` lần nữa sang từ tiếp.

## Cấu trúc

```
src/
  app/                  # App Router: (public)/, (auth)/, (app)/learn/, admin/, api/
  features/             # theo tính năng: study/, admin/, auth/ (components, actions.ts, schemas.ts)
  components/           # UI dùng chung
  server/               # chỉ chạy phía server (import "server-only")
    env.ts              # đọc + validate biến môi trường bằng Zod
    log.ts              # logger pino (JSON, che field nhạy cảm)
    auth/               # Better Auth, Actor + kiểm tra role, helper session
    db/                 # MongoClient, kiểu document và collection
    dal/                # nơi duy nhất được gọi MongoDB (ESLint chặn import ở chỗ khác)
  lib/                  # code thuần dùng cả hai phía: sm2.ts, day.ts, stats.ts, i18n
  messages/vi.json      # chuỗi giao diện
  proxy.ts              # chặn sớm /learn, /admin khi chưa có cookie phiên
migrations/             # runner, CLI, danh sách và script migration
scripts/                # seed, set-role (chạy ngoài Next.js)
test/                   # helper test tích hợp
docker/                 # Dockerfile, Caddyfile, script Mongo
compose*.yml
.github/workflows/ci.yml
```

## Ghi chú và quyết định

- **Hướng đi:** `docs/describtion.md` mô tả bản chỉ chạy trên trình duyệt (Vite + Dexie). Dự án đi theo `CLAUDE.md` (Next.js full-stack); file đó chỉ dùng tham khảo đặc tả tính năng học.
- **MongoDB 8.2.12:** bản 8.0 và 8.3 từ chối khởi động trên Linux kernel ≥ 6.19 ([SERVER-121912](https://jira.mongodb.org/browse/SERVER-121912)). Cần kiểm tra lại kernel của server production trước khi đổi phiên bản.
- **S3 ở dev:** image MinIO không còn trên Docker Hub. Sẽ chọn server S3-compatible cho dev ở Giai đoạn 2 khi cần upload.
- **Ngoại lệ cho quy tắc "chỉ DAL chạm Mongo":** `migrations/` và `scripts/` (chạy ngoài Next.js) và `src/server/auth/auth.ts` (adapter của Better Auth quản lý `users`/`sessions`/`accounts`).
- **Đăng nhập (tạm thời):** chỉ email + mật khẩu, **chưa xác minh email** và chưa có Google — theo yêu cầu làm bản đơn giản trước. Bật lại khi có nhà cung cấp email: `requireEmailVerification: true` trong `src/server/auth/auth.ts` + adapter `Mailer`. Giới hạn tần suất đăng nhập/đăng ký dùng bộ có sẵn của Better Auth (bộ nhớ trong, chỉ bật ở production).
- **Role và múi giờ** là field của `users`, khai báo `input: false` nên client không gửi được khi đăng ký. Múi giờ mặc định `Asia/Ho_Chi_Minh` (chưa có trang cài đặt).
- **`cacheComponents` tắt:** hầu hết trang đọc session nên đằng nào cũng render động.
- **Quiz:** đáp án đúng nằm trong dữ liệu gửi xuống trình duyệt (để báo đúng/sai ngay). Chấp nhận được với app tự học; nếu sau này có kiểm tra tính điểm thì phải chấm phía server.
- **Mục "Quản trị" trên thanh menu** ẩn ở màn hình dưới 640px (không đủ chỗ); vẫn vào được bằng đường dẫn `/admin`.
- **`/api/health` không cần đăng nhập:** chỉ trả trạng thái kết nối DB, không đọc dữ liệu.
- **CI:** chạy lint, format, typecheck, test (có Mongo thật), build và build image. Đẩy GHCR, quét Trivy, deploy staging/prod để Giai đoạn 3.
- **Lỗi "OS file watch limit reached" khi `npm run dev`:** tăng giới hạn inotify, ví dụ `sudo sysctl fs.inotify.max_user_watches=524288` (thêm vào `/etc/sysctl.d/` để giữ sau khi khởi động lại).
