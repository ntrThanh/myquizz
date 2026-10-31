Hãy xây dựng một web app học từ vựng tiếng Anh dạng quiz/flashcard, chạy hoàn toàn trên trình duyệt (không cần backend), lưu dữ liệu bằng IndexedDB. Làm theo từng bước bên dưới, hoàn thành và chạy được từng bước trước khi sang bước sau. Ưu tiên đơn giản, code gọn, dễ đọc.

## Tech stack
- React + TypeScript + Vite
- Tailwind CSS
- Dexie.js cho IndexedDB
- React Router
- Vitest để test logic SM-2
- Không dùng thư viện UI nặng; không cần đăng nhập

## Mô hình dữ liệu (Dexie)
- Deck: id, name, createdAt
- Card: id, deckId, word, meaningVi, ipa?, example?, audioUrl?, n (mặc định 0), ef (mặc định 2.5), interval (mặc định 0, đơn vị ngày), dueDate (mặc định hôm nay), createdAt
- ReviewLog: id, cardId, q (0-5), reviewedAt

## Thuật toán SM-2 (đặt trong src/lib/sm2.ts, là hàm thuần, không phụ thuộc UI)
Đầu vào: card hiện tại {n, ef, interval} và điểm q (0-5). Đầu ra: {n, ef, interval, dueDate} mới.
- Nếu q < 3: n = 0, interval = 1.
- Nếu q >= 3: n = n + 1; nếu n == 1 thì interval = 1; n == 2 thì interval = 6; n >= 3 thì interval = round(interval_cũ * ef).
- Luôn cập nhật: ef = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)); ef không được nhỏ hơn 1.3.
- dueDate = hôm nay + interval ngày (tính theo ngày local, so sánh theo đầu ngày).
- Bốn nút chấm điểm trong UI ánh xạ: Again = 0, Hard = 3, Good = 4, Easy = 5.
- Viết unit test cho: chuỗi Good liên tiếp cho interval 1, 6, 15, 38 (ef giữ 2.5); Easy làm ef thành 2.6; Hard làm ef thành 2.36; Again reset n về 0; ef không bao giờ dưới 1.3.

## Tính năng cần làm (theo thứ tự)
1. Khung app + quản lý Deck và Card: danh sách deck, tạo/sửa/xóa deck, trong deck thêm/sửa/xóa thẻ (word, meaningVi, example tùy chọn). Có seed vài thẻ mẫu để thử.
2. Chế độ Flashcard (ôn tập SM-2): trang "Ôn hôm nay" lấy các thẻ có dueDate <= hôm nay, hiện mặt trước (từ tiếng Anh), bấm để lật xem nghĩa, rồi chấm bằng 4 nút Again/Hard/Good/Easy. Mỗi lần chấm: cập nhật card bằng SM-2 và ghi ReviewLog. Hiện số thẻ còn lại; hết thẻ thì có màn hình hoàn thành.
3. Chế độ Quiz trắc nghiệm: hiện từ tiếng Anh, 4 đáp án nghĩa (1 đúng + 3 nhiễu lấy ngẫu nhiên từ các thẻ khác cùng deck; nếu deck ít hơn 4 thẻ thì lấy từ deck khác hoặc báo cần thêm thẻ). Hiện đúng/sai ngay, cuối phiên hiển thị điểm và danh sách từ làm sai. Kết quả đúng/sai cũng cập nhật SM-2 (đúng = Good, sai = Again).
4. Chế độ Gõ đáp án: hiện nghĩa tiếng Việt, người dùng gõ từ tiếng Anh. So sánh không phân biệt hoa thường, bỏ khoảng trắng thừa. Đúng thì Good, sai thì Again và hiện đáp án đúng.
5. Trang Thống kê: số thẻ cần ôn hôm nay, tổng số thẻ, streak (số ngày liên tiếp có ít nhất 1 lượt ôn, tính từ ReviewLog), tỉ lệ nhớ đúng 7 ngày gần nhất (số lượt q >= 3 chia tổng lượt ôn).
6. Giao diện: responsive, dùng tốt trên điện thoại, hỗ trợ phím tắt trong chế độ ôn (Space để lật, 1-4 để chấm điểm), có dark mode theo hệ thống.

## Yêu cầu chất lượng
- Cấu trúc thư mục rõ ràng: src/lib (sm2, db), src/pages, src/components.
- Xử lý trạng thái rỗng (chưa có deck, chưa có thẻ, không có thẻ đến hạn).
- Không để lỗi TypeScript; chạy `npm run build` và `npm test` phải pass.
- Viết README ngắn: cách cài, chạy, test, và mô tả cấu trúc.

## Cách làm việc
- Trước khi code, tóm tắt kế hoạch ngắn và tạo cấu trúc project.
- Sau mỗi tính năng, chạy build/test và tự kiểm tra, rồi báo ngắn gọn đã làm gì.
- Nếu có chỗ chưa rõ thì chọn phương án đơn giản nhất và ghi chú lại trong README, không dừng lại hỏi.
- Chưa làm các tính năng giai đoạn sau (audio, API từ điển, import CSV, đồng bộ đăng nhập, game Match); chỉ chừa chỗ trong schema (ipa, audioUrl).