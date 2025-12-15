-- Seed data for products table
INSERT INTO products (id, name, slug, sku, description, price_cents, compare_at_price_cents, stock_quantity, is_active, created_at, updated_at) VALUES
('prod_001', '經典白T恤', 'classic-white-tee', 'TEE-WHT-001', '100% 純棉經典款白色T恤，舒適透氣，四季百搭。', 59000, 79000, 100, 1, 1734220800000, 1734220800000),
('prod_002', '深藍牛仔褲', 'dark-blue-jeans', 'JNS-BLU-001', '修身剪裁深藍色牛仔褲，彈性布料穿著舒適。', 129000, 159000, 50, 1, 1734220800000, 1734220800000),
('prod_003', '黑色連帽外套', 'black-hoodie', 'HDY-BLK-001', '厚磅刷毛連帽外套，保暖又有型。', 149000, 189000, 30, 1, 1734220800000, 1734220800000),
('prod_004', '灰色運動短褲', 'grey-sport-shorts', 'SRT-GRY-001', '透氣速乾運動短褲，適合健身與日常穿著。', 69000, NULL, 80, 1, 1734220800000, 1734220800000),
('prod_005', '條紋Polo衫', 'stripe-polo', 'PLO-STP-001', '經典條紋Polo衫，商務休閒兩相宜。', 89000, 109000, 45, 1, 1734220800000, 1734220800000),
('prod_006', '卡其休閒褲', 'khaki-chinos', 'CHN-KHK-001', '百搭卡其色休閒褲，修身版型。', 99000, 129000, 60, 1, 1734220800000, 1734220800000),
('prod_007', '軍綠飛行外套', 'olive-bomber', 'BMB-OLV-001', '經典MA-1飛行外套，軍綠配色。', 249000, 299000, 20, 1, 1734220800000, 1734220800000),
('prod_008', '印花短袖襯衫', 'print-shirt', 'SHT-PRT-001', '夏日印花短袖襯衫，輕鬆度假風。', 79000, NULL, 35, 1, 1734220800000, 1734220800000),
('prod_009', '質感皮革皮帶', 'premium-leather-belt', 'BLT-001', '頂級真皮皮帶，精緻金屬扣環，提升整體穿搭質感。', 99000, NULL, 40, 1, 1734220800000, 1734220800000),
('prod_010', '簡約帆布包', 'minimal-canvas-bag', 'BAG-001', '簡約設計帆布包，大容量，輕便耐用。', 69000, 89000, 25, 1, 1734220800000, 1734220800000),
('prod_011', '復古牛仔外套', 'vintage-denim-jacket', 'JKT-001', '經典復古風格牛仔外套，百搭款式，適合各種場合。', 189000, 249000, 30, 1, 1734220800000, 1734220800000),
('prod_012', '運動休閒褲', 'sport-casual-pants', 'PNT-001', '彈性舒適運動休閒褲，適合運動與日常穿著。', 89000, NULL, 45, 1, 1734220800000, 1734220800000),
('prod_013', '夏日亞麻襯衫', 'summer-linen-shirt', 'SHT-LNN-001', '透氣亞麻材質，夏日必備清涼襯衫。', 129000, 159000, 35, 1, 1734220800000, 1734220800000);

-- Seed data for product_images table
INSERT INTO product_images (id, product_id, url, sort_order, created_at) VALUES
('img_001', 'prod_001', '/images/products/classic-white-tee.png', 0, 1734220800000),
('img_002', 'prod_002', '/images/products/dark-blue-jeans.png', 0, 1734220800000),
('img_003', 'prod_003', '/images/products/black-hoodie.png', 0, 1734220800000),
('img_004', 'prod_004', '/images/products/grey-sport-shorts.png', 0, 1734220800000),
('img_005', 'prod_005', '/images/products/stripe-polo.png', 0, 1734220800000),
('img_006', 'prod_006', '/images/products/khaki-chinos.png', 0, 1734220800000),
('img_007', 'prod_007', '/images/products/olive-bomber.png', 0, 1734220800000),
('img_008', 'prod_008', '/images/products/print-shirt.png', 0, 1734220800000),
('img_009', 'prod_009', '/images/products/premium-leather-belt.png', 0, 1734220800000),
('img_010', 'prod_010', '/images/products/minimal-canvas-bag.png', 0, 1734220800000),
('img_011', 'prod_011', '/images/products/vintage-denim-jacket.png', 0, 1734220800000),
('img_012', 'prod_012', '/images/products/sport-casual-pants.png', 0, 1734220800000),
('img_013', 'prod_013', '/images/products/summer-linen-shirt.png', 0, 1734220800000);
