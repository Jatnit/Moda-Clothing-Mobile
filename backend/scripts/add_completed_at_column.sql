-- Thêm cột CompletedAt vào bảng Orders nếu chưa có
-- Cột này lưu thời điểm đơn hàng được giao/hoàn thành

-- Kiểm tra và thêm cột nếu chưa tồn tại
ALTER TABLE Orders
ADD COLUMN IF NOT EXISTS CompletedAt TIMESTAMP NULL DEFAULT NULL AFTER Status;

-- Cập nhật CompletedAt cho các đơn đã hoàn thành (nếu chưa có giá trị)
UPDATE Orders
SET
    CompletedAt = UpdatedAt
WHERE
    Status = 'Hoàn thành'
    AND CompletedAt IS NULL;

-- (Tùy chọn) Thêm index để tối ưu query
CREATE INDEX IF NOT EXISTS idx_orders_completed ON Orders (UserId, Status, CompletedAt);