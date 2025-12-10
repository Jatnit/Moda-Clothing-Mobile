const { pool } = require('../config/database');

/**
 * Lấy tất cả danh mục
 * GET /api/categories
 */
const getCategories = async (req, res) => {
  try {
    const [categories] = await pool.execute(`
      SELECT 
        c.Id, c.Name, c.Slug, c.ParentId, c.ImageUrl,
        (SELECT COUNT(*) FROM ProductCategories pc WHERE pc.CategoryId = c.Id) as ProductCount
      FROM Categories c
      ORDER BY c.Name ASC
    `);

    // Tổ chức thành cây phân cấp
    const rootCategories = categories.filter(c => c.ParentId === null);
    const childCategories = categories.filter(c => c.ParentId !== null);

    rootCategories.forEach(parent => {
      parent.children = childCategories.filter(c => c.ParentId === parent.Id);
    });

    res.json({
      success: true,
      data: rootCategories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

/**
 * Lấy chi tiết danh mục
 * GET /api/categories/:idOrSlug
 */
const getCategoryDetail = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isId = !isNaN(idOrSlug);
    const whereClause = isId ? 'c.Id = ?' : 'c.Slug = ?';

    const [categories] = await pool.execute(`
      SELECT 
        c.Id, c.Name, c.Slug, c.ParentId, c.ImageUrl,
        (SELECT COUNT(*) FROM ProductCategories pc WHERE pc.CategoryId = c.Id) as ProductCount
      FROM Categories c
      WHERE ${whereClause}
    `, [idOrSlug]);

    if (categories.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy danh mục.'
      });
    }

    const category = categories[0];

    // Lấy danh mục con
    const [children] = await pool.execute(`
      SELECT Id, Name, Slug, ImageUrl 
      FROM Categories 
      WHERE ParentId = ?
    `, [category.Id]);
    category.children = children;

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Get category detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server. Vui lòng thử lại.'
    });
  }
};

module.exports = {
  getCategories,
  getCategoryDetail
};
