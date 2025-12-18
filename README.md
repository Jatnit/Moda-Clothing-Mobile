# 🛍️ Moda Clothing - Ứng dụng Mobile Thương mại Điện tử

Ứng dụng bán quần áo thời trang được phát triển với React Native (Expo) và Node.js Backend.

---

## 📊 CÔNG NGHỆ SỬ DỤNG

### 🖥️ Frontend (Mobile App)

| Công nghệ             | Version | Mô tả                                                            |
| --------------------- | ------- | ---------------------------------------------------------------- |
| **React Native**      | 0.81.5  | Framework phát triển ứng dụng mobile đa nền tảng (iOS & Android) |
| **React**             | 19.1.0  | Thư viện UI JavaScript                                           |
| **Expo**              | 54.0.27 | Platform phát triển & build React Native                         |
| **JavaScript (ES6+)** | -       | Ngôn ngữ lập trình chính                                         |

**Thư viện chính:**

- **React Navigation** - Điều hướng màn hình (Stack, Bottom Tabs)
- **Axios** - HTTP Client gọi REST API
- **AsyncStorage** - Lưu trữ local (token, user info)
- **Expo Vector Icons** - Thư viện icon (Ionicons)

### ⚙️ Backend (REST API)

| Công nghệ      | Version            | Mô tả                 |
| -------------- | ------------------ | --------------------- |
| **Node.js**    | 18+                | JavaScript Runtime    |
| **Express.js** | 4.18.2             | Web Framework         |
| **MySQL**      | 8.0 / MariaDB 10.4 | Cơ sở dữ liệu quan hệ |
| **JavaScript** | -                  | Ngôn ngữ lập trình    |

**Thư viện chính:**

- **mysql2** - MySQL driver cho Node.js
- **jsonwebtoken (JWT)** - Xác thực người dùng
- **bcryptjs** - Mã hóa mật khẩu
- **express-validator** - Validate dữ liệu đầu vào
- **cors** - Cross-Origin Resource Sharing
- **dotenv** - Quản lý biến môi trường
- **nodemon** - Hot-reload cho development

### 🏗️ Kiến trúc & Pattern

| Aspect               | Description                        |
| -------------------- | ---------------------------------- |
| **Architecture**     | RESTful API + Mobile Client        |
| **Auth Pattern**     | JWT (Access Token + Refresh Token) |
| **State Management** | React Hooks (useState, useEffect)  |
| **Code Structure**   | MVC Pattern (Backend)              |
| **API Design**       | RESTful conventions                |

---

## 📁 CẤU TRÚC THƯ MỤC

```
Moda-Clothing-Mobile/
├── backend/                      # API Server (Node.js + Express + MySQL)
│   ├── config/                  # Cấu hình database, JWT
│   │   └── database.js
│   ├── controllers/             # Xử lý logic API
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── orderController.js
│   │   ├── cartController.js
│   │   ├── addressController.js
│   │   ├── reviewController.js
│   │   └── ...
│   ├── routes/                  # Định tuyến API
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   └── ...
│   ├── middleware/              # Middleware (auth, validation)
│   │   └── auth.js
│   ├── public/                  # Static files (API docs)
│   ├── database_schema.sql      # 📌 File SQL tạo database
│   ├── .env.example             # Template biến môi trường
│   ├── package.json
│   └── server.js                # Entry point
│
└── Moda-Clothing-App/            # Mobile App (React Native + Expo)
    ├── src/
    │   ├── screens/             # Các màn hình
    │   │   ├── HomeScreen.js
    │   │   ├── ProductDetailScreen.js
    │   │   ├── CartScreen.js
    │   │   ├── CheckoutScreen.js
    │   │   ├── OrdersScreen.js
    │   │   ├── ProfileScreen.js
    │   │   ├── AddressesScreen.js
    │   │   └── ...
    │   ├── services/            # API services
    │   ├── config/              # Cấu hình (API URL)
    │   └── theme/               # Styles, colors
    ├── App.js                   # Entry point
    └── package.json
```

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT VÀ CHẠY

### 📋 Yêu cầu

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MySQL** >= 8.0 hoặc **MariaDB** >= 10.4
- **Expo CLI** (cài global): `npm install -g expo-cli`
- **Expo Go** app trên điện thoại (để test trên thiết bị thật)

---

### Bước 1: Clone Repository

```bash
git clone https://github.com/your-username/Moda-Clothing-Mobile.git
cd Moda-Clothing-Mobile
```

---

### Bước 2: Tạo Database MySQL

#### Cách 1: Sử dụng Command Line

```bash
# Đăng nhập MySQL
mysql -u root -p

# Tạo database mới
CREATE DATABASE jwt CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Thoát MySQL
exit;

# Import schema từ file SQL
mysql -u root -p jwt < backend/database_schema.sql
```

#### Cách 2: Sử dụng phpMyAdmin

1. Mở **phpMyAdmin**: http://localhost/phpmyadmin
2. Click **"New"** (tạo database mới)
3. Đặt tên: `jwt`
4. Collation: `utf8mb4_unicode_ci`
5. Click **"Create"**
6. Chọn database `jwt` vừa tạo
7. Click tab **"Import"**
8. Chọn file: `backend/database_schema.sql`
9. Click **"Go"** để import

#### Cách 3: Sử dụng MySQL Workbench

1. Mở **MySQL Workbench**
2. Kết nối đến MySQL Server
3. **File > Open SQL Script** → Chọn `backend/database_schema.sql`
4. Thực thi script (⚡ icon)

**✅ Sau khi import thành công:**

- Database `jwt` với đầy đủ tables
- Dữ liệu mẫu (sản phẩm, user, đơn hàng...)
- User test: `phung@gmail.com` / `123456`

---

### Bước 3: Cấu hình Backend

```bash
# Navigate đến thư mục backend
cd backend

# Cài đặt dependencies
npm install

# Tạo file .env từ template
cp .env.example .env
```

**Chỉnh sửa file `backend/.env`:**

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password    # ← Thay bằng password MySQL của bạn
DB_NAME=jwt
DB_PORT=3306

# Server
PORT=8080

# JWT
JWT_SECRET=moda_clothing_secret_key_2024
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=moda_refresh_secret_key_2024
JWT_REFRESH_EXPIRES_IN=30d
```

---

### Bước 4: Chạy Backend Server

```bash
cd backend

# Development mode (auto-reload khi code thay đổi)
npm run dev

# HOẶC Production mode
npm start
```

**✅ Khi thành công, bạn sẽ thấy:**

```
🚀 ════════════════════════════════════════
   🌟 Moda Clothing API Server
═══════════════════════════════════════════
   📍 Server:  http://localhost:8080
   📚 API Docs: http://localhost:8080/api/docs
   🔄 Database: jwt ✅ Connected
═══════════════════════════════════════════
```

---

### Bước 5: Cấu hình & Chạy Frontend Mobile App

```bash
# Mở Terminal mới, navigate đến thư mục app
cd Moda-Clothing-App

# Cài đặt dependencies
npm install

# Chạy Expo development server
npm start
```

**📱 Các cách chạy app:**

```bash
# Hiển thị QR code để quét bằng Expo Go
npm start

# Chạy trực tiếp trên iOS Simulator (macOS)
npm run ios

# Chạy trực tiếp trên Android Emulator
npm run android
```

**⚙️ Cấu hình IP (nếu dùng thiết bị thật):**

Mở file `Moda-Clothing-App/src/config/api.js` và đổi IP:

```javascript
// Tìm dòng này và thay bằng IP máy tính của bạn
const LOCAL_IP = "192.168.1.XXX"; // ← Thay IP của bạn
```

**Tìm IP máy tính:**

```bash
# macOS
ipconfig getifaddr en0

# Windows
ipconfig | findstr IPv4

# Linux
hostname -I
```

---

## 📱 CHẠY DỰ ÁN (TÓM TẮT)

Mở **2 Terminal** song song:

### Terminal 1 - Backend API

```bash
cd Moda-Clothing-Mobile/backend
npm run dev
```

### Terminal 2 - Mobile App

```bash
cd Moda-Clothing-Mobile/Moda-Clothing-App
npm start
```

---

## 📱 TÍNH NĂNG ỨNG DỤNG

### 👤 Người dùng

- ✅ Đăng ký / Đăng nhập / Quên mật khẩu
- ✅ Xem và cập nhật profile
- ✅ Quản lý địa chỉ giao hàng

### 🛍️ Sản phẩm

- ✅ Trang chủ với banner, categories, featured products
- ✅ Danh sách sản phẩm theo danh mục
- ✅ Chi tiết sản phẩm với variants (màu sắc, kích thước)
- ✅ Tìm kiếm sản phẩm
- ✅ Sản phẩm yêu thích (Wishlist)

### 🛒 Mua hàng

- ✅ Giỏ hàng (thêm, sửa số lượng, xóa)
- ✅ Checkout với chọn địa chỉ có sẵn hoặc nhập mới
- ✅ Chọn phương thức thanh toán (COD, Banking, MoMo, VNPay)
- ✅ Đặt hàng

### 📦 Đơn hàng

- ✅ Danh sách đơn hàng
- ✅ Chi tiết đơn hàng
- ✅ Theo dõi trạng thái đơn hàng
- ✅ Hủy đơn hàng

### ⭐ Đánh giá

- ✅ Xem đánh giá sản phẩm
- ✅ Viết đánh giá sau khi mua hàng

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

- **API Docs**: http://localhost:8080/api/docs
- **Health check**: http://localhost:8080/
- **Products**: http://localhost:8080/api/products

---

## 📞 API ENDPOINTS

| Module     | Method | Endpoint                   | Auth | Mô tả               |
| ---------- | ------ | -------------------------- | ---- | ------------------- |
| Health     | GET    | `/`                        | ❌   | Kiểm tra server     |
| Docs       | GET    | `/api/docs`                | ❌   | API Documentation   |
| Auth       | POST   | `/api/auth/register`       | ❌   | Đăng ký             |
| Auth       | POST   | `/api/auth/login`          | ❌   | Đăng nhập           |
| Auth       | GET    | `/api/auth/me`             | ✅   | Lấy thông tin user  |
| Products   | GET    | `/api/products`            | ❌   | Danh sách sản phẩm  |
| Products   | GET    | `/api/products/:id`        | ❌   | Chi tiết sản phẩm   |
| Categories | GET    | `/api/categories`          | ❌   | Danh sách danh mục  |
| Cart       | GET    | `/api/cart`                | ✅   | Lấy giỏ hàng        |
| Cart       | POST   | `/api/cart`                | ✅   | Thêm vào giỏ        |
| Orders     | GET    | `/api/orders`              | ✅   | Danh sách đơn hàng  |
| Orders     | POST   | `/api/orders`              | ✅   | Tạo đơn hàng        |
| Addresses  | GET    | `/api/addresses`           | ✅   | Danh sách địa chỉ   |
| Addresses  | POST   | `/api/addresses`           | ✅   | Thêm địa chỉ        |
| Wishlist   | GET    | `/api/wishlist`            | ✅   | Danh sách yêu thích |
| Reviews    | GET    | `/api/reviews/product/:id` | ❌   | Đánh giá sản phẩm   |

**✅ = Cần gửi header:** `Authorization: Bearer <token>`

---

## ❌ TROUBLESHOOTING

### Lỗi: "Cannot connect to MySQL"

```bash
# macOS - Kiểm tra MySQL đang chạy
brew services list | grep mysql
brew services start mysql

# Windows - Kiểm tra XAMPP/WAMP đã start MySQL

# Linux
sudo systemctl status mysql
sudo systemctl start mysql
```

### Lỗi: "Port 8080 already in use"

```bash
# Tìm process đang dùng port 8080
lsof -i :8080

# Kill process
kill -9 <PID>
```

### Lỗi: "Network request failed" trên Mobile

- ✅ Đảm bảo sử dụng **IP thực** (không phải localhost) cho thiết bị thật
- ✅ Kiểm tra backend và mobile đang **cùng mạng WiFi**
- ✅ Firewall không chặn port 8080

### Lỗi: Expo Metro bundler cache

```bash
# Clear cache và restart
npx expo start --clear
```

### Lỗi: "ER_NOT_SUPPORTED_AUTH_MODE" MySQL 8

```sql
-- Chạy trong MySQL
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

---

## 👨‍💻 TÀI KHOẢN TEST

| Email             | Password   | Role  |
| ----------------- | ---------- | ----- |
| `phung@gmail.com` | `123456`   | User  |
| `admin@moda.com`  | `admin123` | Admin |

---

## 📄 LICENSE

MIT License - Xem file [LICENSE](LICENSE) để biết thêm chi tiết.

---

## 🤝 ĐÓNG GÓP

1. Fork repository
2. Tạo branch mới (`git checkout -b feature/TinhNangMoi`)
3. Commit changes (`git commit -m 'Thêm tính năng mới'`)
4. Push to branch (`git push origin feature/TinhNangMoi`)
5. Tạo Pull Request

---

## 📞 LIÊN HỆ

- **Email**: your-email@example.com
- **GitHub**: https://github.com/your-username

---

**⭐ Nếu dự án hữu ích, hãy cho một star nhé!**
