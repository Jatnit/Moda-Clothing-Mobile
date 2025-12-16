const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { testConnection, getTables } = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const addressRoutes = require('./routes/addressRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: '*', // Trong production, hãy chỉ định domain cụ thể
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'public')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🎉 Moda Clothing API Server đang hoạt động!',
    version: '1.0.0',
    database: process.env.DB_NAME || 'jwt',
    documentation: `http://localhost:${PORT}/api/docs`,
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      orders: '/api/orders',
      addresses: '/api/addresses',
      reviews: '/api/reviews',
      wishlist: '/api/wishlist',
      docs: '/api/docs'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);

// API Documentation - Beautiful HTML page
app.get('/api/docs', (req, res) => {
  const docsPath = path.join(__dirname, 'public', 'docs.html');
  
  if (fs.existsSync(docsPath)) {
    // Đọc file và thay thế PORT
    let html = fs.readFileSync(docsPath, 'utf8');
    html = html.replace(/\{\{PORT\}\}/g, PORT);
    res.type('html').send(html);
  } else {
    // Fallback to JSON if HTML not found
    res.json({
      success: true,
      message: 'Moda Clothing API Documentation',
      version: '1.0.0',
      baseUrl: `http://localhost:${PORT}/api`,
      endpoints: {
        authentication: {
          'POST /auth/register': 'Đăng ký tài khoản mới',
          'POST /auth/login': 'Đăng nhập',
          'POST /auth/refresh-token': 'Làm mới access token',
          'POST /auth/logout': 'Đăng xuất (auth required)',
          'GET /auth/me': 'Lấy thông tin user (auth required)',
          'PUT /auth/change-password': 'Đổi mật khẩu (auth required)',
          'PUT /auth/profile': 'Cập nhật profile (auth required)'
        },
        products: {
          'GET /products': 'Lấy danh sách sản phẩm',
          'GET /products/search?q=': 'Tìm kiếm sản phẩm',
          'GET /products/featured': 'Sản phẩm bán chạy',
          'GET /products/new': 'Sản phẩm mới nhất',
          'GET /products/category/:slug': 'Sản phẩm theo danh mục',
          'GET /products/:idOrSlug': 'Chi tiết sản phẩm'
        },
        categories: {
          'GET /categories': 'Lấy tất cả danh mục',
          'GET /categories/:idOrSlug': 'Chi tiết danh mục'
        },
        orders: {
          'GET /orders': 'Lấy danh sách đơn hàng (auth required)',
          'POST /orders': 'Tạo đơn hàng (auth required)',
          'GET /orders/:id': 'Chi tiết đơn hàng (auth required)',
          'PUT /orders/:id/cancel': 'Hủy đơn hàng (auth required)'
        },
        addresses: {
          'GET /addresses': 'Lấy danh sách địa chỉ (auth required)',
          'POST /addresses': 'Thêm địa chỉ (auth required)',
          'PUT /addresses/:id': 'Cập nhật địa chỉ (auth required)',
          'DELETE /addresses/:id': 'Xóa địa chỉ (auth required)',
          'PUT /addresses/:id/default': 'Đặt địa chỉ mặc định (auth required)'
        },
        reviews: {
          'GET /reviews/product/:productId': 'Lấy reviews của sản phẩm',
          'GET /reviews/my': 'Lấy reviews của user (auth required)',
          'POST /reviews': 'Tạo review (auth required)'
        }
      }
    });
  }
});

// API Documentation JSON (cho các tools auto-generate)
app.get('/api/docs.json', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'Moda Clothing API',
      version: '1.0.0',
      description: 'RESTful API cho ứng dụng thời trang Moda Clothing'
    },
    servers: [
      { url: `http://localhost:${PORT}/api`, description: 'Development server' }
    ],
    paths: {
      '/auth/register': { post: { summary: 'Đăng ký tài khoản', tags: ['Auth'] } },
      '/auth/login': { post: { summary: 'Đăng nhập', tags: ['Auth'] } },
      '/products': { get: { summary: 'Lấy danh sách sản phẩm', tags: ['Products'] } },
      '/products/{id}': { get: { summary: 'Chi tiết sản phẩm', tags: ['Products'] } },
      '/categories': { get: { summary: 'Lấy danh mục', tags: ['Categories'] } },
      '/orders': { 
        get: { summary: 'Lấy đơn hàng', tags: ['Orders'], security: [{ bearerAuth: [] }] },
        post: { summary: 'Tạo đơn hàng', tags: ['Orders'], security: [{ bearerAuth: [] }] }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Không tìm thấy endpoint này.',
    documentation: `http://localhost:${PORT}/api/docs`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Lỗi server nội bộ.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Không thể kết nối database. Vui lòng kiểm tra cấu hình.');
      console.log('\n📝 Hướng dẫn:');
      console.log('1. Đảm bảo MySQL server đang chạy');
      console.log('2. Tạo file .env từ .env.example');
      console.log('3. Cập nhật thông tin database trong file .env');
      process.exit(1);
    }

    // Hiển thị các bảng có trong database
    await getTables();

    // Start listening - bind to 0.0.0.0 to allow connections from other devices
    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n🚀 ════════════════════════════════════════');
      console.log('   🌟 Moda Clothing API Server');
      console.log('═══════════════════════════════════════════');
      console.log(`   📍 Server:  http://localhost:${PORT}`);
      console.log(`   📱 Mobile:  http://YOUR_IP:${PORT}`);
      console.log(`   📚 API Docs: http://localhost:${PORT}/api/docs`);
      console.log(`   🔄 Database: ${process.env.DB_NAME || 'jwt'}`);
      console.log('═══════════════════════════════════════════\n');
    });
  } catch (error) {
    console.error('❌ Lỗi khởi động server:', error);
    process.exit(1);
  }
};

startServer();
