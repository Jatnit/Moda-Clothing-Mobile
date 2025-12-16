-- Tạo bảng Wishlist cho tính năng sản phẩm yêu thích
-- Chạy trong MySQL Workbench hoặc phpMyAdmin

CREATE TABLE IF NOT EXISTS Wishlist (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    UserId INT NOT NULL,
    ProductId INT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_product (UserId, ProductId),
    FOREIGN KEY (UserId) REFERENCES Users (Id) ON DELETE CASCADE,
    FOREIGN KEY (ProductId) REFERENCES Products (Id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Kiểm tra bảng đã tạo
DESCRIBE Wishlist;