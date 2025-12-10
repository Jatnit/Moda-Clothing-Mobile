# 🛍️ Moda Clothing - Hướng dẫn Chạy Dự án

## 📁 Cấu trúc thư mục

```
Moda-Clothing-Mobile/
├── backend/                 # API Server (Node.js + Express + MySQL)
│   ├── config/             # Cấu hình database, JWT
│   ├── controllers/        # Xử lý logic API
│   ├── routes/             # Định tuyến API
│   ├── middleware/         # Middleware (auth, validation)
│   ├── public/             # Static files (API docs)
│   └── server.js           # Entry point
│
└── Moda-Clothing-App/       # Mobile App (React Native + Expo)
    ├── App.js
    └── ...
```

---

## 🚀 HƯỚNG DẪN CHẠY

### Bước 1: Chuẩn bị Database MySQL

Đảm bảo MySQL đang chạy và database `jwt` đã tồn tại.

```bash
# Kiểm tra MySQL đang chạy
mysql -u root -e "SHOW DATABASES;"

# Nếu chưa có database jwt, tạo mới:
mysql -u root -e "CREATE DATABASE jwt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

---

### Bước 2: Chạy Backend API Server

```bash
# Mở Terminal 1 - Navigate đến thư mục backend
cd /Users/jatnit/Documents/GitHub/Moda-Clothing-Mobile/backend

# Cài đặt dependencies (chỉ cần lần đầu)
npm install

# Tạo file .env (nếu chưa có)
cp .env.example .env

# Chạy server (development mode với auto-reload)
npm run dev

# HOẶC chạy server production
npm start
```

**✅ Khi thành công, bạn sẽ thấy:**

```
🚀 ════════════════════════════════════════
   🌟 Moda Clothing API Server
═══════════════════════════════════════════
   📍 Server:  http://localhost:8080
   📚 API Docs: http://localhost:8080/api/docs
   🔄 Database: jwt
═══════════════════════════════════════════
```

**📚 Truy cập API Documentation:** http://localhost:8080/api/docs

---

### Bước 3: Chạy Frontend Mobile App

```bash
# Mở Terminal 2 - Navigate đến thư mục app
cd /Users/jatnit/Documents/GitHub/Moda-Clothing-Mobile/Moda-Clothing-App

# Cài đặt dependencies (chỉ cần lần đầu)
npm install

# Chạy Expo development server
npm start

# HOẶC chạy trực tiếp trên iOS Simulator
npm run ios

# HOẶC chạy trực tiếp trên Android Emulator
npm run android
```

**✅ Khi thành công, bạn sẽ thấy QR code và menu:**

```
› Press s │ switch to Expo Go
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
```

---

## 🔧 CẤU HÌNH

### Backend (.env)

File: `backend/.env`

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=         # Thêm password MySQL của bạn nếu có
DB_NAME=jwt
DB_PORT=3306

# Server
PORT=8080

# JWT
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d
```

### Frontend (API URL)

Khi kết nối từ mobile app đến backend:

```javascript
// Nếu chạy trên iOS Simulator
const API_URL = "http://localhost:8080/api";

// Nếu chạy trên Android Emulator
const API_URL = "http://10.0.2.2:8080/api";

// Nếu chạy trên thiết bị thật (thay YOUR_IP bằng IP máy tính)
const API_URL = "http://YOUR_IP:8080/api";
```

**Tìm IP máy tính:**

```bash
# macOS
ipconfig getifaddr en0

# Hoặc
ifconfig | grep "inet " | grep -v 127.0.0.1
```

---

## 📱 CHẠY SONG SONG 2 TERMINAL

### Terminal 1 - Backend

```bash
cd /Users/jatnit/Documents/GitHub/Moda-Clothing-Mobile/backend
npm run dev
```

### Terminal 2 - Frontend

```bash
cd /Users/jatnit/Documents/GitHub/Moda-Clothing-Mobile/Moda-Clothing-App
npm start
```

---

## 🔍 KIỂM TRA API

### Test bằng curl

```bash
# Health check
curl http://localhost:8080/

# Lấy danh sách sản phẩm
curl http://localhost:8080/api/products

# Lấy danh mục
curl http://localhost:8080/api/categories

# Đăng nhập
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "phung@gmail.com", "password": "123456"}'
```

### Test bằng Browser

- API Docs: http://localhost:8080/api/docs
- Health check: http://localhost:8080/
- Products: http://localhost:8080/api/products

---

## ❌ TROUBLESHOOTING

### Lỗi: "Cannot connect to MySQL"

```bash
# Kiểm tra MySQL đang chạy
brew services list | grep mysql
# Nếu chưa chạy:
brew services start mysql
```

### Lỗi: "Port 8080 already in use"

```bash
# Tìm process đang dùng port 8080
lsof -i :8080
# Kill process
kill -9 <PID>
```

### Lỗi: "Network request failed" trên Mobile

- Đảm bảo dùng đúng IP (không phải localhost cho thiết bị thật)
- Kiểm tra cả backend và mobile đang cùng mạng WiFi

### Lỗi: Expo Metro bundler

```bash
# Clear cache và restart
npx expo start --clear
```

---

## 📞 API ENDPOINTS

| Module     | Method | Endpoint                   | Auth |
| ---------- | ------ | -------------------------- | ---- |
| Health     | GET    | `/`                        | ❌   |
| Docs       | GET    | `/api/docs`                | ❌   |
| Auth       | POST   | `/api/auth/register`       | ❌   |
| Auth       | POST   | `/api/auth/login`          | ❌   |
| Auth       | GET    | `/api/auth/me`             | ✅   |
| Products   | GET    | `/api/products`            | ❌   |
| Products   | GET    | `/api/products/:id`        | ❌   |
| Categories | GET    | `/api/categories`          | ❌   |
| Orders     | GET    | `/api/orders`              | ✅   |
| Orders     | POST   | `/api/orders`              | ✅   |
| Addresses  | GET    | `/api/addresses`           | ✅   |
| Reviews    | GET    | `/api/reviews/product/:id` | ❌   |

**✅ = Cần gửi header:** `Authorization: Bearer <token>`

---

## 🎉 HOÀN TẤT!

Sau khi chạy cả 2 terminal:

- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/api/docs
- **Mobile App**: Quét QR code trên Expo Go hoặc chạy simulator

Chúc bạn code vui vẻ! 🚀
