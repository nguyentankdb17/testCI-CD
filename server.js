// server.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Hàm để lấy thông điệp chào mừng, dễ dàng cho việc unit test
function getWelcomeMessage() {
  // BẠN SẼ THAY ĐỔI DÒNG NÀY TRONG LÚC DEMO
  return "Chào mừng đến với Demo CI/CD v1.0!";
}

app.get('/', (req, res) => {
  const message = getWelcomeMessage();
  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
      <h1>${message}</h1>
      <p>Ứng dụng đã được triển khai thành công qua luồng CI/CD tự động.</p>
    </div>
  `);
});

// Endpoint cho Kubernetes liveness/readiness probes
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const server = app.listen(PORT, () => {
  console.log(`Ứng dụng đang chạy trên cổng ${PORT}`);
});

// Xuất các thành phần để test
module.exports = { app, server, getWelcomeMessage };