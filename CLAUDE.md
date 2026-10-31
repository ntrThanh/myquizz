# CLAUDE.md

Hướng dẫn cho Claude Code khi làm việc trong repo này. Đọc kỹ trước khi sửa code. Khi có mâu thuẫn giữa file này và yêu cầu trực tiếp của người dùng trong phiên, ưu tiên yêu cầu của người dùng, nhưng phải nói rõ chỗ lệch.

## 1. Dự án

Web app học từ vựng tiếng Anh: flashcard, quiz, ôn tập theo spaced repetition (SM-2). Có khu vực quản trị (/admin) để quản lý khóa học, bài học, từ vựng, blog, thông báo và người dùng. Mục tiêu: chạy production thật, đăng nhập bằng Google, email và số điện thoại, triển khai bằng Docker.

Người dùng cuối nói tiếng Việt. Giao diện tiếng Việt, có cấu trúc i18n để thêm tiếng Anh sau.

## 2. Tech stack

| Lớp | Công nghệ |
|---|---|
| Framework | Next.js (App Router) + TypeScript strict |
| UI | Tailwind CSS |
| CSDL | MongoDB (replica set, bật xác thực); driver chính thức `mongodb` |
| Validate | Zod (mọi input từ bên ngoài) |
| Đăng nhập | Better Auth + adapter MongoDB |
| Lưu file | Bucket tương thích S3 (R2 ở production; server S3 cho dev chọn ở GĐ 2 vì image MinIO đã bị gỡ khỏi Docker Hub) qua AWS SDK v3 |
| Cache/rate limit | Redis (tùy chọn ở giai đoạn đầu; có fallback in-memory cho dev) |
| Email | Nhà cung cấp email giao dịch (cấu hình qua env, bọc sau interface `Mailer`) |
| SMS/OTP | Nhà cung cấp Việt Nam (ưu tiên Zalo ZNS, dự phòng SMS), bọc sau interface `SmsProvider` |
| Test | Vitest (unit/integration), Playwright (e2e luồng chính) |
| Chất lượng | ESLint, Prettier, `tsc --noEmit` |
| Container | Docker, Docker Compose, Caddy (reverse proxy + HTTPS) |
| CI/CD | GitHub Actions, image đẩy lên GHCR |
| Giám sát | pino (log JSON), Sentry, endpoint `/api/health` |

Không thêm thư viện mới nếu chưa cần. Khi cần, giải thích lý do ngắn gọn trong commit/PR.

## 3. Lệnh thường dùng

Các lệnh dưới đây khớp với `package.json` hiện tại. Khi đổi script, sửa file này cho khớp.

```bash
# Phát triển
./docker/scripts/gen-keyfile.sh                          # một lần: keyfile replica set
docker compose -f compose.yml -f compose.dev.yml up -d   # Mongo (replica set) + Redis cho dev
npm run dev                                              # Next.js dev server

# Kiểm tra chất lượng (bắt buộc pass trước khi báo xong)
npm run lint
npm run typecheck          # next typegen && tsc --noEmit
npm run format:check
npm test
npm run build

# CSDL
npm run db:migrate          # chạy migration và tạo index
npm run db:migrate:status   # xem trạng thái migration
npm run db:migrate:down     # quay lại một migration gần nhất
npm run db:seed             # dữ liệu mẫu (chỉ dev/staging)

# Docker production (trên server)
docker compose -f compose.yml -f compose.prod.yml pull
docker compose -f compose.yml -f compose.prod.yml up -d
```

## 4. Cấu trúc thư mục

```
src/
  app/
    (public)/        # trang công khai: trang chủ, blog, danh sách khóa học
    (app)/           # khu vực người dùng đã đăng nhập: học, ôn tập, thống kê
    admin/           # khu quản trị
    api/
      auth/[...all]/ # handler Better Auth
      health/        # health check cho Docker/giám sát
  features/          # code theo tính năng: study, courses, blog, announcements, admin, auth
                     # mỗi feature: components/, actions.ts (server actions), schemas.ts (Zod)
  server/            # CHỈ chạy phía server (import 'server-only')
    db/              # client Mongo, định nghĩa collection, kiểu dữ liệu
    dal/             # lớp truy cập dữ liệu (nơi duy nhất được chạm Mongo)
    auth/            # cấu hình Better Auth, helper session/role
    storage/         # S3 client, upload, kiểm tra file
    mail/ sms/       # interface + adapter nhà cung cấp
    rate-limit/      # giới hạn tần suất
    audit/           # ghi audit log
  lib/               # code thuần dùng cả hai phía: sm2.ts, utils, hằng số
  messages/          # chuỗi giao diện (vi.json, sau này en.json)
migrations/          # script migration + index cho MongoDB (có version)
docker/
  Dockerfile
  caddy/Caddyfile
  scripts/           # backup.sh, restore.sh, healthcheck
compose.yml          # định nghĩa chung
compose.dev.yml      # dev: mở cổng, MinIO, Mongo không ép TLS
compose.prod.yml     # prod: giới hạn tài nguyên, secrets, log rotation
.github/workflows/   # CI/CD
```

## 5. Quy tắc kiến trúc bắt buộc

### 5.1 Lớp truy cập dữ liệu (DAL) và phân quyền

Vì không có Row Level Security, **toàn bộ bảo mật dữ liệu nằm ở code**. Quy tắc:

- **Chỉ `src/server/dal/` được gọi MongoDB.** Component, route handler, server action không được import client Mongo trực tiếp.
- Mọi hàm DAL nhận `session` (hoặc người gọi đã được xác thực) và tự kiểm tra quyền trước khi chạm DB, qua các helper như `requireUser()`, `requireRole('editor')`, `requireRole('admin')`.
- Dữ liệu cá nhân (tiến độ, log ôn tập) luôn lọc theo `userId` **lấy từ session**, không bao giờ từ input của client.
- Người dùng thường chỉ thấy nội dung `status: 'published'`. Bản `draft` chỉ editor/admin thấy.
- Middleware chỉ là lớp chặn đầu. **Kiểm tra thật nằm ở server action và DAL.**
- Mọi file trong `src/server/` bắt đầu bằng `import 'server-only'`.
- Viết test cho ma trận quyền (khách, user, editor, admin) trên từng hàm DAL. Thêm hàm DAL mới thì thêm test quyền tương ứng.

Vai trò: `user` | `editor` | `admin`.
- `editor`: quản lý khóa học, bài, từ vựng, blog, thông báo.
- `admin`: mọi quyền của editor + đổi role người dùng + xem audit log + cấu hình hệ thống.
- Người dùng không thể tự nâng quyền của mình.

### 5.2 Mô hình dữ liệu MongoDB

Tách **nội dung dùng chung** khỏi **tiến độ từng người**.

Collection chính: `users`, `accounts`, `sessions`, `verifications` (do Better Auth quản lý), `courses`, `lessons`, `words`, `userWordProgress`, `reviewLogs`, `posts`, `announcements`, `announcementReads`, `auditLogs`.

Index bắt buộc (tạo qua migration, không tạo tay):
- `courses`: unique `slug`; `(status, sort)`
- `lessons`: `(courseId, sort)`
- `words`: `(lessonId, status)`; text index cho tìm kiếm
- `userWordProgress`: **unique `(userId, wordId)`**; `(userId, dueDate)`
- `reviewLogs`: `(userId, reviewedAt)`
- `posts`: unique `slug`; `(status, publishedAt)`
- `announcements`: `(status, startsAt, endsAt)`
- `auditLogs`: `(createdAt)`, `(actorId, createdAt)`

Quy ước:
- Mọi document có `createdAt`, `updatedAt` (kiểu `Date`, UTC).
- Nội dung có `status`: `draft` | `published`.
- Dùng `ObjectId` cho khóa; chuyển sang chuỗi ở ranh giới với client.
- Thêm JSON Schema validation ở phía Mongo cho các collection quan trọng.
- Ghi nhiều document liên quan thì dùng transaction (đã có replica set).
- Mọi danh sách phải phân trang; không bao giờ trả về toàn bộ collection.

### 5.3 Migration

- Mọi thay đổi cấu trúc dữ liệu hoặc index phải là một migration có version trong `migrations/`. Không sửa DB production bằng tay.
- File migration đặt ở `migrations/scripts/NNNN-ten.ts` và phải được thêm vào cuối mảng trong `migrations/index.ts`. `migrations/` là ngoại lệ duy nhất được dùng driver `mongodb` ngoài `src/server/dal/` (chạy ngoài Next.js).
- Migration phải **idempotent** và có hướng quay lại (down) khi khả thi.
- Chạy migration trong pipeline deploy, trước khi bật phiên bản app mới.
- Đổi tên/xóa field: làm theo hai bước (thêm mới + chuyển dữ liệu, rồi mới xóa) để deploy không gián đoạn.

### 5.4 Đăng nhập

- Phương thức: Google OAuth, email (magic link hoặc mật khẩu + xác minh email), số điện thoại (OTP, làm ở giai đoạn sau).
- Cho phép liên kết nhiều phương thức vào cùng một tài khoản.
- Cookie phiên: `Secure`, `HttpOnly`, `SameSite=Lax`.
- **Phone OTP bắt buộc có:** giới hạn tần suất theo số điện thoại và IP, captcha (Cloudflare Turnstile), mã hết hạn ngắn, giới hạn số lần nhập sai, ngân sách SMS tối đa mỗi ngày kèm cảnh báo. Không bật tính năng này ở production nếu thiếu các lớp trên.
- Bọc nhà cung cấp SMS/email sau interface (`SmsProvider`, `Mailer`) để đổi nhà cung cấp mà không sửa logic nghiệp vụ.

### 5.5 Thuật toán SM-2 (`src/lib/sm2.ts`)

Hàm thuần, không phụ thuộc UI hay DB.
- Đầu vào `{n, ef, interval}` và điểm `q` (0-5); đầu ra `{n, ef, interval, dueDate}`.
- `q < 3`: `n = 0`, `interval = 1`.
- `q >= 3`: `n += 1`; `n == 1` → `interval = 1`; `n == 2` → `interval = 6`; `n >= 3` → `interval = round(interval_cũ * ef)`.
- `ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))`, tối thiểu 1.3, mặc định ban đầu 2.5.
- Nút giao diện: Again = 0, Hard = 3, Good = 4, Easy = 5. Quiz: đúng = Good, sai = Again.
- `dueDate` tính theo ngày (đầu ngày, múi giờ của người dùng), lưu dạng UTC.
- Mọi thay đổi ở file này phải có unit test. Test bắt buộc: chuỗi Good cho interval 1, 6, 15, 38; Easy đưa ef lên 2.6; Hard đưa ef xuống 2.36; Again reset `n`; `ef` không dưới 1.3.
- Ghi `reviewLogs` cho mỗi lượt ôn để sau này có thể nâng cấp lên FSRS.

## 6. Bảo mật

- Mọi input từ client (form, server action, query, body) phải qua Zod ở phía server.
- **Không bao giờ** đưa secret xuống client hoặc commit vào git. Biến `NEXT_PUBLIC_*` chỉ chứa giá trị công khai.
- Nội dung blog (HTML từ trình soạn thảo) phải được làm sạch (sanitize) trước khi lưu và trước khi hiển thị.
- Upload: kiểm tra loại file bằng nội dung thật (không chỉ phần mở rộng), giới hạn dung lượng, đổi tên ngẫu nhiên, chỉ cho phép loại ảnh được duyệt.
- Giới hạn tần suất cho: đăng nhập, đăng ký, gửi OTP, gửi email, các API ghi.
- Header bảo mật: CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- Mọi thao tác tạo/sửa/xóa của editor/admin ghi vào `auditLogs` (ai, làm gì, trên đối tượng nào, lúc nào).
- Không log dữ liệu nhạy cảm (mật khẩu, OTP, token, số điện thoại đầy đủ). Che bớt khi cần log.
- Số điện thoại, email là dữ liệu cá nhân: chỉ thu thập phần cần thiết; có chức năng xóa tài khoản và xuất dữ liệu.

## 7. Docker và triển khai

**Dockerfile** (`docker/Dockerfile`): build nhiều giai đoạn (deps → builder → runner), `output: "standalone"` trong `next.config.ts`, chạy bằng `node server.js`, `USER node` (không chạy root), có `HEALTHCHECK` gọi `/api/health`. Ghim phiên bản base image cụ thể (Node LTS bản slim), không dùng `latest`.

**Quy tắc:**
- Một image duy nhất cho mọi môi trường; khác nhau ở biến môi trường lúc chạy.
- Không nhúng secret vào image. Production dùng Docker secrets hoặc file env ngoài repo.
- Nếu chạy nhiều bản sao app, đặt `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` cố định.
- **MongoDB không được publish cổng ra host ở production**; chỉ app truy cập qua mạng Docker nội bộ.
- MongoDB: bật xác thực, keyfile cho replica set, user của app chỉ có `readWrite` trên đúng database của app (không dùng root trong chuỗi kết nối), volume đặt tên riêng.
- Compose production: `restart: unless-stopped`, giới hạn CPU/RAM, `logging` có `max-size` và `max-file`.
- Caddy làm reverse proxy và tự cấp HTTPS; chỉ Caddy mở cổng 80/443.
- Máy chủ: firewall chỉ mở 22/80/443, SSH chỉ dùng key.

**Lưu ý hạ tầng:** replica set 1 node trên một VPS + backup ngoài máy là điểm khởi đầu. Replica set nhiều node chỉ có ý nghĩa khi mỗi node nằm trên máy khác nhau. Không giả lập "HA" bằng nhiều container trên cùng một máy.

## 8. CI/CD

Mỗi pull request: lint → typecheck → test → build. Merge vào `main`: build image, quét lỗ hổng (Trivy), đẩy lên GHCR gắn tag theo commit, deploy staging tự động, deploy production cần duyệt thủ công. Deploy: pull image → chạy migration → `up -d` → kiểm tra health → nếu lỗi thì quay về tag cũ. Giữ ít nhất 3 image gần nhất để rollback.

## 9. Backup và giám sát

- Backup `mongodump` hằng đêm, nén và mã hóa, đẩy lên bucket **ngoài máy chủ**. Giữ 7 bản ngày, 4 bản tuần, 3 bản tháng. Backup cả bucket ảnh.
- Diễn tập khôi phục vào staging mỗi tháng; backup chưa từng khôi phục thử thì chưa tính là đáng tin.
- Log JSON có cấu trúc (pino), có `requestId`. Sentry cho lỗi. Uptime monitor gọi `/api/health` mỗi phút. Cảnh báo khi đĩa vượt 80%.

## 10. Quy ước code và giao diện

- TypeScript strict, không dùng `any` trừ khi có lý do và ghi chú tại chỗ.
- Ưu tiên Server Component; chỉ dùng Client Component khi cần tương tác.
- Mutation đi qua server action hoặc route handler, luôn: xác thực → phân quyền → validate Zod → gọi DAL → ghi audit (nếu là thao tác quản trị) → revalidate cache.
- Mọi trang xử lý đủ trạng thái: loading, rỗng, lỗi.
- Giao diện responsive (ưu tiên điện thoại), dark mode theo hệ thống, có thể dùng bàn phím (phím tắt trong chế độ ôn: Space lật, 1-4 chấm điểm), đạt yêu cầu truy cập cơ bản (label, tương phản, focus).
- Chuỗi giao diện đặt trong `src/messages/`, không viết cứng trong component.
- Tên file và thư mục: `kebab-case`; component: `PascalCase`; hàm/biến: `camelCase`.
- Giữ code đơn giản, dễ đọc. Không trừu tượng hóa sớm.

## 11. Cách làm việc

- Việc lớn: tóm tắt kế hoạch ngắn trước khi code, làm tuần tự từng bước, mỗi bước build và chạy được trước khi sang bước sau.
- Git: nhánh `feat/...`, `fix/...`; commit nhỏ, thông điệp theo Conventional Commits (`feat:`, `fix:`, `chore:`...). Không commit trực tiếp lên `main`.
- Chỗ chưa rõ: chọn phương án đơn giản và an toàn nhất, ghi chú vào README hoặc mô tả commit, không dừng lại hỏi. **Ngoại lệ:** nếu liên quan đến bảo mật, phân quyền, xóa/mất dữ liệu hoặc chi phí (SMS, dịch vụ trả tiền) thì dừng lại và hỏi.
- Không làm vượt phạm vi yêu cầu. Tính năng giai đoạn sau chỉ chừa chỗ (schema, interface, placeholder), không cài đặt sớm.
- Cập nhật README khi thay đổi cách cài đặt, biến môi trường, lệnh hoặc cấu trúc. Cập nhật file này khi quy ước thay đổi.

### Định nghĩa "xong" cho một thay đổi
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` đều pass
- [ ] Có test cho logic mới (đặc biệt: SM-2, phân quyền, validate)
- [ ] Hàm DAL mới có kiểm tra quyền và test quyền
- [ ] Thay đổi dữ liệu/index đi kèm migration
- [ ] Không có secret, `console.log` thừa, hoặc code chết
- [ ] README/`.env.example` đã cập nhật nếu cần

## 12. Không được làm

- Không gọi MongoDB ngoài `src/server/dal/` (ngoại lệ: `migrations/`). ESLint chặn import `mongodb` và `@/server/db` ở những chỗ khác trong `src/`.
- Không tin `userId`, `role` hay bất kỳ quyền nào từ input của client.
- Không đưa `service_role`-kiểu secret hoặc khóa API xuống client.
- Không publish cổng MongoDB ra internet; không dùng tài khoản root trong chuỗi kết nối của app.
- Không sửa dữ liệu hoặc index production bằng tay, ngoài migration.
- Không hiển thị HTML chưa sanitize.
- Không bật phone OTP ở production khi chưa có rate limit, captcha và ngân sách SMS.
- Không xóa dữ liệu người dùng hoặc chạy lệnh phá hủy (drop, deleteMany không điều kiện) nếu chưa có yêu cầu rõ ràng.

## 13. Biến môi trường

Liệt kê đầy đủ trong `.env.example` (không commit `.env`, `.env.local`). Nhóm chính:

```
# App
APP_URL=
NODE_ENV=
NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=       # bắt buộc khi chạy nhiều bản sao

# MongoDB
MONGODB_URI=                              # user riêng của app, không dùng root
MONGODB_DB=

# Auth
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Lưu file (S3-compatible)
S3_ENDPOINT=
S3_REGION=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_PUBLIC_BASE_URL=

# Email / SMS
MAIL_PROVIDER_API_KEY=
MAIL_FROM=
SMS_PROVIDER=
SMS_API_KEY=
SMS_DAILY_BUDGET=                         # giới hạn chi phí mỗi ngày

# Chống lạm dụng / giám sát
TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
REDIS_URL=
SENTRY_DSN=
```

## 14. Lộ trình và trạng thái

Cập nhật mục này khi hoàn thành từng giai đoạn.

- [x] **Giai đoạn 0: Hạ tầng.** Repo, Dockerfile, Compose dev/prod, Mongo replica set có xác thực, Caddy, CI cơ bản, `/api/health`. (Mongo ghim 8.2.12 vì 8.0/8.3 không chạy trên kernel ≥ 6.19. Workflow CI chưa chạy trên GitHub vì repo chưa có remote.)
- [ ] **Giai đoạn 1: Lõi sản phẩm.** Better Auth (Google + email), DAL + phân quyền + test ma trận quyền, app học (flashcard SM-2, quiz, gõ đáp án, thống kê), khung /admin, quản lý role, audit log.
- [ ] **Giai đoạn 2: Nội dung.** CRUD khóa học/bài/từ vựng, import CSV, upload ảnh S3, blog (Tiptap, sanitize, SEO, sitemap, RSS), thông báo.
- [ ] **Giai đoạn 3: Hardening.** Rate limit, CSP và header, Sentry, uptime monitor, backup tự động + diễn tập khôi phục, quét image.
- [ ] **Giai đoạn 4: Mở rộng.** Phone OTP (Zalo → SMS), game Match/Spell, tự điền IPA/audio từ API từ điển, PWA, i18n tiếng Anh, nhắc ôn tập.

Chỉ làm giai đoạn hiện tại. Chưa xong giai đoạn trước thì không sang giai đoạn sau.