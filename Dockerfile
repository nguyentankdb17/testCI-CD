# ---- Giai đoạn 1: Build ----
# Sử dụng một image Node đầy đủ để build
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt các dependencies
RUN npm install

# Sao chép toàn bộ mã nguồn
COPY . .

# (Tùy chọn) Bạn có thể chạy test ở đây để đảm bảo mọi thứ ổn trước khi qua giai đoạn sau
# RUN npm test

# ---- Giai đoạn 2: Production ----
# Sử dụng một image Node mỏng nhẹ cho production
FROM node:18-alpine

WORKDIR /usr/src/app

# Sao chép các dependencies đã được cài đặt từ giai đoạn "builder"
COPY --from=builder /usr/src/app/node_modules ./node_modules
# Sao chép mã nguồn ứng dụng
COPY --from=builder /usr/src/app .

# Mở cổng 3000
EXPOSE 3000

# Lệnh để khởi chạy ứng dụng
CMD [ "node", "server.js" ]