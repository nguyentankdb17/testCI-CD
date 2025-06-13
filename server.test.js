// server.test.js
const { app, server, getWelcomeMessage } = require('./server');
const request = require('supertest');

// Đảm bảo server đóng lại sau khi test xong
afterAll((done) => {
  server.close(done);
});

describe('Các bài test cho ứng dụng Express', () => {

  // Test 1: Kiểm tra endpoint chính
  test('GET / nên trả về mã 200 và thông điệp chào mừng', async () => {
    const response = await request(app).get('/');
    expect(response.statusCode).toBe(200);
    expect(response.text).toContain(getWelcomeMessage());
  });

  // Test 2: Kiểm tra endpoint sức khỏe
  test('GET /health nên trả về mã 200 và "OK"', async () => {
    const response = await request(app).get('/health');
    expect(response.statusCode).toBe(200);
    expect(response.text).toBe('OK');
  });

  // Test 3: Kiểm tra hàm logic riêng biệt
  test('Hàm getWelcomeMessage nên trả về chuỗi chính xác', () => {
    const expectedMessage = "Chào mừng đến với Demo CI/CD v1.0!";
    expect(getWelcomeMessage()).toBe(expectedMessage);
  });
});