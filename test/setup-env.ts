// Chạy trước mỗi file test. Khi có MONGODB_TEST_URI, trỏ app sang một DB test riêng cho file đó.
const uri = process.env.MONGODB_TEST_URI;
if (uri) {
  process.env.MONGODB_URI = uri;
  process.env.MONGODB_DB = `quizz_test_${process.env.VITEST_POOL_ID ?? "0"}_${process.pid}`;
}
process.env.APP_URL ??= "http://localhost:3000";
process.env.BETTER_AUTH_SECRET ??= "test-secret-test-secret-test-secret-123";
