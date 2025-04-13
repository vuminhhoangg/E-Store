import Product from '../models/Product.js';
import asyncHandler from 'express-async-handler';
import httpStatus from 'http-status';

// ===== API dành cho người dùng thông thường =====

// Lấy sản phẩm nổi bật (sản phẩm có số lượng tồn kho nhiều nhất)
export const getTopProducts = asyncHandler(async (req, res) => {
    try {
        const { category, limit = 8 } = req.query;
        const limitNumber = Number(limit);

        // Xây dựng query
        let query = {
            countInStock: { $gt: 0 }  // Chỉ lấy sản phẩm còn hàng
        };

        // Lọc theo danh mục nếu có
        if (category && category !== '') {
            query.category = category;
        }

        // Tìm sản phẩm và sắp xếp theo số lượng tồn kho giảm dần
        const products = await Product.find(query)
            .sort({ countInStock: -1 })
            .limit(limitNumber);

        if (products.length === 0) {
            // Nếu không có sản phẩm thỏa mãn điều kiện, lấy bất kỳ sản phẩm nào
            delete query.countInStock;
            const fallbackProducts = await Product.find(query)
                .sort({ createdAt: -1 })
                .limit(limitNumber);

            return res.status(httpStatus.OK).json({
                data: { products: fallbackProducts },
                message: 'Top products retrieved successfully (fallback to all products)'
            });
        }

        return res.status(httpStatus.OK).json({
            data: { products },
            message: 'Top products retrieved successfully'
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            data: null,
            message: error.message
        });
    }
});

// Lấy tất cả sản phẩm
export const getProducts = async (req, res) => {
    try {
        const pageSize = 10;
        const page = Number(req.query.page) || 1;
        const keyword = req.query.keyword ? {
            name: {
                $regex: req.query.keyword,
                $options: 'i'
            }
        } : {};

        const count = await Product.countDocuments({ ...keyword });
        const products = await Product.find({ ...keyword })
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        res.status(200).json({
            success: true,
            data: products,
            page,
            pages: Math.ceil(count / pageSize),
            count
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách sản phẩm',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Lấy sản phẩm theo ID
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy thông tin sản phẩm',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Tạo sản phẩm mới
export const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            image,
            brand,
            category,
            countInStock,
            rating,
            numReviews,
            warrantyPeriodMonths
        } = req.body;

        const product = new Product({
            name,
            description,
            price,
            image,
            brand,
            category,
            countInStock,
            rating,
            numReviews,
            warrantyPeriodMonths,
        });

        const createdProduct = await product.save();

        res.status(201).json({
            success: true,
            data: createdProduct
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tạo sản phẩm',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Cập nhật sản phẩm
export const updateProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            image,
            brand,
            category,
            countInStock,
            warrantyPeriodMonths
        } = req.body;

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        product.name = name || product.name;
        product.description = description || product.description;
        product.price = price || product.price;
        product.image = image || product.image;
        product.brand = brand || product.brand;
        product.category = category || product.category;
        product.countInStock = countInStock || product.countInStock;
        product.warrantyPeriodMonths = warrantyPeriodMonths || product.warrantyPeriodMonths;

        const updatedProduct = await product.save();

        return res.status(200).json({
            success: true,
            data: updatedProduct
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể cập nhật sản phẩm',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ===== API dành cho admin =====

// Lấy tất cả sản phẩm (bao gồm cả sản phẩm ẩn)
export const adminGetAllProducts = async (req, res) => {
    try {
        // Lấy các tham số truy vấn từ request
        const { keyword, category, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

        // Xây dựng query
        let query = {};

        // Tìm kiếm theo keyword
        if (keyword) {
            query.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { brand: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }

        // Lọc theo danh mục
        if (category && category !== 'all') {
            query.category = category;
        }

        // Lọc theo giá
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        // Tính toán phân trang
        const pageNum = Number(page);
        const pageSize = Number(limit);
        const skip = (pageNum - 1) * pageSize;

        // Thực hiện truy vấn
        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);

        // Đếm tổng số sản phẩm
        const total = await Product.countDocuments(query);

        // Trả về kết quả
        return res.status(200).json({
            success: true,
            count: products.length,
            total,
            totalPages: Math.ceil(total / pageSize),
            currentPage: pageNum,
            data: products
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi, không thể lấy danh sách sản phẩm'
        });
    }
};

// Lấy thông tin sản phẩm theo ID (admin)
export const adminGetProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        return res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin sản phẩm:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi, không thể lấy thông tin sản phẩm'
        });
    }
};

// Tạo sản phẩm mới (Admin)
export const adminCreateProduct = async (req, res) => {
    try {
        const { name, brand, category, description, price, countInStock, image } = req.body;

        // Tạo sản phẩm mới
        const product = await Product.create({
            name,
            brand,
            category,
            description,
            price,
            countInStock,
            image,
            user: req.user._id  // ID của admin tạo sản phẩm
        });

        if (product) {
            return res.status(201).json({
                success: true,
                data: product
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Dữ liệu sản phẩm không hợp lệ'
            });
        }
    } catch (error) {
        console.error('Lỗi khi tạo sản phẩm mới:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi, không thể tạo sản phẩm mới'
        });
    }
};

// Cập nhật thông tin sản phẩm (Admin)
export const adminUpdateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const { name, brand, category, description, price, countInStock, image, isActive } = req.body;

        // Tìm sản phẩm
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Cập nhật thông tin
        if (name) product.name = name;
        if (brand) product.brand = brand;
        if (category) product.category = category;
        if (description !== undefined) product.description = description;
        if (price !== undefined) product.price = price;
        if (countInStock !== undefined) product.countInStock = countInStock;
        if (image) product.image = image;
        if (isActive !== undefined) product.isActive = isActive;

        // Lưu thay đổi
        const updatedProduct = await product.save();

        return res.status(200).json({
            success: true,
            data: updatedProduct
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật thông tin sản phẩm:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi, không thể cập nhật thông tin sản phẩm'
        });
    }
};

// Xóa sản phẩm (Admin)
export const adminDeleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        // Tìm và xóa sản phẩm
        const product = await Product.findByIdAndDelete(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Đã xóa sản phẩm thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi, không thể xóa sản phẩm'
        });
    }
};

// @desc    Xóa sản phẩm
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Đã xóa sản phẩm thành công'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể xóa sản phẩm',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};