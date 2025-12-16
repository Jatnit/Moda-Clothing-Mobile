-- Tạo bảng Cart để lưu giỏ hàng của mỗi user
-- Mỗi user có giỏ hàng riêng được đồng bộ với database

CREATE TABLE IF NOT EXISTS `Cart` (
    `Id` INT(11) NOT NULL AUTO_INCREMENT,
    `UserId` INT(11) NOT NULL,
    `ProductSkuId` INT(11) NOT NULL,
    `Quantity` INT(11) NOT NULL DEFAULT 1,
    `CreatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    `UpdatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
    PRIMARY KEY (`Id`),
    UNIQUE KEY `UK_Cart_User_Sku` (`UserId`, `ProductSkuId`),
    KEY `FK_Cart_User` (`UserId`),
    KEY `FK_Cart_Sku` (`ProductSkuId`),
    CONSTRAINT `FK_Cart_User` FOREIGN KEY (`UserId`) REFERENCES `Users` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_Cart_Sku` FOREIGN KEY (`ProductSkuId`) REFERENCES `ProductSKUs` (`Id`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Index để tối ưu query
CREATE INDEX IF NOT EXISTS idx_cart_user ON Cart (UserId);