import Warranty from '../models/Warranty.js';
import httpStatus from 'http-status';
import Product from "../models/Product.js";
import WarrantyClaim from '../models/WarrantyClaim.js';
import Order from '../models/Order.js';

// Create a new warranty request
export const createWarrantyRequest = async (req, res) => {
    try {
        const { productId, customerId } = req.body;

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(httpStatus.NOT_FOUND).json({
                message: 'Product not found'
            });
        }

        const warrantyRequest = await Warranty.create({
            productId,
            customerId,
            endDate: new Date(Date.now() + product.warrantyPeriodMonths * 30 * 24 * 60 * 60 * 1000), // Calculate end date based on warranty period
        });

        return res.status(httpStatus.CREATED).json({
            data: warrantyRequest,
            message: 'Warranty request created successfully'
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            data: null,
            message: error.message
        });
    }
};

// Get all warranty requests
export const getAllWarrantyRequests = async (req, res) => {
    try {
        const warrantyRequests = await Warranty.find().populate('productId customerId');

        return res.status(httpStatus.OK).json({
            data: warrantyRequests,
            message: 'Warranty requests retrieved successfully'
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            data: null,
            message: error.message
        });
    }
};

// Get a warranty request by ID
export const getWarrantyRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const warrantyRequest = await Warranty.findById(id).populate('productId customerId');

        if (!warrantyRequest) {
            return res.status(httpStatus.NOT_FOUND).json({
                data: null,
                message: 'Warranty request not found'
            });
        }

        return res.status(httpStatus.OK).json({
            data: warrantyRequest,
            message: 'Warranty request retrieved successfully'
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            data: null,
            message: error.message
        });
    }
};

export const getWarrantyRequestByCustomerId = async (req, res) => {
    try {
        const { customerId } = req.params;
        const warrantyRequests = await Warranty.find({ customerId: customerId }).populate('productId customerId');

        if (!warrantyRequests) {
            return res.status(httpStatus.NOT_FOUND).json({
                data: null,
                message: 'Warranty requests not found'
            });
        }

        return res.status(httpStatus.OK).json({
            data: warrantyRequests,
            message: 'Warranty requests retrieved successfully'
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            data: null,
            message: error.message
        });
    }
}

// Update a warranty request
export const updateWarrantyRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, description, method, price, responseMessage } = req.body;

        const warrantyRequest = await Warranty.findById(id);

        if (!warrantyRequest) {
            return res.status(httpStatus.NOT_FOUND).json({
                data: null,
                message: 'Warranty request not found'
            });
        }

        if (status) warrantyRequest.status = status;
        if (responseMessage) warrantyRequest.responseMessage = responseMessage;
        if (method) warrantyRequest.method = method;
        if (price) warrantyRequest.price = price;
        if (description) warrantyRequest.description = description;

        const updatedWarrantyRequest = await warrantyRequest.save();

        return res.status(httpStatus.OK).json({
            data: updatedWarrantyRequest,
            message: 'Warranty request updated successfully'
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            data: null,
            message: error.message
        });
    }
};

// Delete a warranty request
export const deleteWarrantyRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const warrantyRequest = await Warranty.findByIdAndDelete(id);

        if (!warrantyRequest) {
            return res.status(httpStatus.NOT_FOUND).json({
                data: null,
                message: 'Warranty request not found'
            });
        }

        return res.status(httpStatus.OK).json({
            data: warrantyRequest,
            message: 'Warranty request deleted successfully'
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            data: null,
            message: error.message
        });
    }
};

// Get a warranty claim by ID
export const getWarrantyClaimById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Attempting to get warranty claim with ID:', id);

        const warrantyClaim = await WarrantyClaim.findById(id)
            .populate('userId', 'name email phone')
            .populate('productId', 'name image price');

        if (!warrantyClaim) {
            console.log('Warranty claim not found with ID:', id);
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Không tìm thấy yêu cầu bảo hành'
            });
        }

        console.log('Successfully found warranty claim:', warrantyClaim._id);

        // Biến đổi dữ liệu trước khi gửi về client
        const rawClaim = warrantyClaim.toObject();
        const transformedClaim = {
            ...rawClaim,
            // Nếu userId là object (do populate), lấy thông tin từ đó
            customerName: rawClaim.contactName ||
                (rawClaim.userId && typeof rawClaim.userId === 'object' ?
                    rawClaim.userId.name : undefined),

            customerPhone: rawClaim.contactPhone ||
                (rawClaim.userId && typeof rawClaim.userId === 'object' ?
                    rawClaim.userId.phone : undefined),

            customerEmail: rawClaim.contactEmail ||
                (rawClaim.userId && typeof rawClaim.userId === 'object' ?
                    rawClaim.userId.email : undefined),

            // Nếu productId là object (do populate), lấy thông tin từ đó
            productName: rawClaim.productName ||
                (rawClaim.productId && typeof rawClaim.productId === 'object' ?
                    rawClaim.productId.name : undefined),

            productImage: (rawClaim.productId && typeof rawClaim.productId === 'object' ?
                rawClaim.productId.image : undefined),
        };

        console.log('Transformed claim data for client');

        return res.status(httpStatus.OK).json({
            success: true,
            data: transformedClaim,
            message: 'Lấy thông tin yêu cầu bảo hành thành công'
        });
    } catch (error) {
        console.error('Error in getWarrantyClaimById:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
            data: null
        });
    }
};

// Get all warranty claims (with pagination and filtering)
export const getAllWarrantyClaims = async (req, res) => {
    try {
        console.log('=== BEGIN getAllWarrantyClaims ===');
        console.log('Request query params:', req.query);
        console.log('Request user:', req.user?._id);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;

        console.log('Parsed params:', { page, limit, status });

        const skip = (page - 1) * limit;

        const filter = {};
        if (status && status !== 'all') {
            filter.status = status;
        }

        console.log('Using filter:', filter);
        console.log('Checking if WarrantyClaim is defined:', !!WarrantyClaim);

        try {
            console.log('Attempting to count documents...');
            const total = await WarrantyClaim.countDocuments(filter);
            console.log('Total warranty claims found:', total);

            console.log('Attempting to find warranty claims...');
            const warrantyClaims = await WarrantyClaim.find(filter)
                .populate('userId', 'name email phone')
                .populate('productId', 'name image price')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            console.log(`Successfully retrieved ${warrantyClaims.length} warranty claims`);
            console.log('First claim (if exists):', warrantyClaims[0]?._id);

            // Biến đổi dữ liệu trước khi gửi về client
            const transformedClaims = warrantyClaims.map(claim => {
                const rawClaim = claim.toObject(); // Chuyển đổi từ Mongoose Document sang plain JavaScript object

                // Đảm bảo tất cả các trường cần thiết đều có
                return {
                    ...rawClaim,
                    // Nếu userId là object (do populate), lấy thông tin từ đó
                    customerName: rawClaim.contactName ||
                        (rawClaim.userId && typeof rawClaim.userId === 'object' ?
                            rawClaim.userId.name : undefined),

                    customerPhone: rawClaim.contactPhone ||
                        (rawClaim.userId && typeof rawClaim.userId === 'object' ?
                            rawClaim.userId.phone : undefined),

                    customerEmail: rawClaim.contactEmail ||
                        (rawClaim.userId && typeof rawClaim.userId === 'object' ?
                            rawClaim.userId.email : undefined),

                    // Nếu productId là object (do populate), lấy thông tin từ đó
                    productName: rawClaim.productName ||
                        (rawClaim.productId && typeof rawClaim.productId === 'object' ?
                            rawClaim.productId.name : undefined),

                    productImage: (rawClaim.productId && typeof rawClaim.productId === 'object' ?
                        rawClaim.productId.image : undefined),
                };
            });

            console.log('Transformed data for client');

            return res.status(httpStatus.OK).json({
                success: true,
                data: transformedClaims,
                total,
                pages: Math.ceil(total / limit),
                page
            });
        } catch (dbError) {
            console.error('Database operation error:', dbError);
            console.error('Error message:', dbError.message);
            console.error('Error stack:', dbError.stack);
            throw dbError; // Re-throw to be caught by outer catch
        }
    } catch (error) {
        console.error('=== ERROR in getAllWarrantyClaims ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);

        if (error.name === 'MongooseError' || error.name === 'MongoError') {
            console.error('MongoDB details:', error.code, error.keyPattern);
        }

        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: `Lỗi khi lấy danh sách yêu cầu bảo hành: ${error.message}`,
            data: null
        });
    } finally {
        console.log('=== END getAllWarrantyClaims ===');
    }
};

// Update warranty claim status
export const updateWarrantyClaimStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const warrantyClaim = await WarrantyClaim.findById(id);

        if (!warrantyClaim) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Không tìm thấy yêu cầu bảo hành'
            });
        }

        // Cập nhật trạng thái và lưu lịch sử
        warrantyClaim.status = status;

        // Thêm vào lịch sử trạng thái
        warrantyClaim.statusHistory.push({
            status: status,
            updatedBy: req.user._id,
            notes: notes || '',
            createdAt: new Date()
        });

        if (notes) {
            warrantyClaim.adminNotes = notes;
        }

        await warrantyClaim.save();

        return res.status(httpStatus.OK).json({
            success: true,
            data: warrantyClaim,
            message: 'Cập nhật trạng thái yêu cầu bảo hành thành công'
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái yêu cầu bảo hành:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
            data: null
        });
    }
};

// Create warranty claim
export const createWarrantyClaim = async (req, res) => {
    try {
        const { orderItemId } = req.params;
        const { description, status, images } = req.body;

        // Logic tạo yêu cầu bảo hành mới
        // Đây chỉ là placeholder, cần phải triển khai đầy đủ

        return res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Tạo yêu cầu bảo hành thành công',
            data: {}
        });
    } catch (error) {
        console.error('Lỗi khi tạo yêu cầu bảo hành:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message,
            data: null
        });
    }
};

// Lấy danh sách tất cả sản phẩm đang trong thời gian bảo hành
export const getAllProductsUnderWarranty = async (req, res) => {
    try {
        console.log('=== BEGIN getAllProductsUnderWarranty ===');
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const productsUnderWarranty = [];
        const currentDate = new Date();

        // 1. Lấy sản phẩm từ bảng Warranty
        console.log('Đang lấy dữ liệu từ bảng Warranty...');
        const warranties = await Warranty.find({})
            .populate('productId', 'name price warrantyPeriodMonths')
            .populate('customerId', 'userName phoneNumber')
            .populate('orderId', 'orderNumber createdAt deliveredAt')
            .sort({ endDate: 1 });

        console.log(`Tìm thấy ${warranties.length} bảo hành từ bảng Warranty`);

        // Xử lý danh sách từ bảng Warranty
        warranties.forEach(warranty => {
            if (warranty.endDate && currentDate <= new Date(warranty.endDate)) {
                // Sử dụng trường startDate nếu có, nếu không thì dùng createdAt
                const startDate = warranty.startDate || warranty.createdAt;
                const endDate = new Date(warranty.endDate);

                // Tính thời gian bảo hành còn lại (ngày)
                const remainingTime = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));

                // Tỷ lệ bảo hành đã sử dụng (%)
                const totalWarrantyDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
                const usedDays = totalWarrantyDays - remainingTime;
                const warrantyPercentage = Math.min(100, Math.max(0, Math.round((usedDays / totalWarrantyDays) * 100)));

                // Thêm vào danh sách sản phẩm đang bảo hành
                productsUnderWarranty.push({
                    productId: warranty.productId?._id || warranty.productId,
                    productName: warranty.productName || (warranty.productId?.name || 'Không rõ tên sản phẩm'),
                    serialNumber: warranty.serialNumber || ('W-' + warranty._id.toString().slice(-8)),
                    orderId: warranty.orderId?._id || warranty.orderId,
                    orderNumber: warranty.orderNumber || (warranty.orderId?.orderNumber || ('Warranty-' + warranty._id.toString().slice(-6))),
                    customer: {
                        id: warranty.customerId?._id || '',
                        name: warranty.customerId?.userName || 'Không rõ tên',
                        phone: warranty.customerId?.phoneNumber || 'Không rõ SĐT'
                    },
                    warrantyStartDate: warranty.startDate || warranty.createdAt,
                    warrantyEndDate: warranty.endDate,
                    warrantyPeriodMonths: Math.round(totalWarrantyDays / 30),
                    remainingDays: remainingTime,
                    warrantyPercentage: warrantyPercentage,
                    orderDate: warranty.orderId?.createdAt || warranty.createdAt,
                    deliveryDate: warranty.orderId?.deliveredAt || warranty.createdAt,
                    source: 'warranty'
                });
            }
        });

        // 2. Lấy sản phẩm từ đơn hàng có kích hoạt bảo hành
        console.log('Đang lấy dữ liệu từ đơn hàng đã kích hoạt bảo hành...');
        const orders = await Order.find({
            warrantyActivated: true,
            'items.warrantyPeriodMonths': { $gt: 0 }
        })
            .populate('userId', 'userName phoneNumber')
            .sort({ 'items.warrantyEndDate': 1 });

        console.log(`Tìm thấy ${orders.length} đơn hàng có sản phẩm đang bảo hành`);

        orders.forEach(order => {
            // Lấy thông tin khách hàng
            const customerInfo = order.userId ? {
                id: order.userId._id,
                name: order.userId.userName,
                phone: order.userId.phoneNumber
            } : { id: order.userId, name: 'Unknown', phone: 'Unknown' };

            // Lọc các sản phẩm đang trong thời gian bảo hành
            order.items.forEach(item => {
                if (item.warrantyPeriodMonths > 0 && item.warrantyStartDate && item.warrantyEndDate) {
                    const endDate = new Date(item.warrantyEndDate);
                    const startDate = new Date(item.warrantyStartDate);

                    // Chỉ thêm vào danh sách nếu sản phẩm vẫn trong thời gian bảo hành
                    if (currentDate <= endDate) {
                        // Tính thời gian bảo hành còn lại (tính theo ngày)
                        const remainingTime = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));

                        // Tỷ lệ bảo hành đã sử dụng (%)
                        const totalWarrantyDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
                        const usedDays = totalWarrantyDays - remainingTime;
                        const warrantyPercentage = Math.min(100, Math.max(0, Math.round((usedDays / totalWarrantyDays) * 100)));

                        productsUnderWarranty.push({
                            productId: item.productId,
                            productName: item.name,
                            serialNumber: item.serialNumber || 'N/A',
                            orderId: order._id,
                            orderNumber: order.orderNumber,
                            customer: customerInfo,
                            warrantyStartDate: item.warrantyStartDate,
                            warrantyEndDate: item.warrantyEndDate,
                            warrantyPeriodMonths: item.warrantyPeriodMonths,
                            remainingDays: remainingTime,
                            warrantyPercentage: warrantyPercentage,
                            orderDate: order.createdAt,
                            deliveryDate: order.deliveredAt,
                            source: 'order'
                        });
                    }
                }
            });
        });

        // Sắp xếp sản phẩm theo thời gian bảo hành còn lại
        productsUnderWarranty.sort((a, b) => a.remainingDays - b.remainingDays);

        // Phân trang
        const total = productsUnderWarranty.length;
        const paginatedProducts = productsUnderWarranty.slice(skip, skip + limit);

        return res.status(200).json({
            success: true,
            count: paginatedProducts.length,
            total: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: paginatedProducts,
            message: 'Lấy danh sách sản phẩm đang bảo hành thành công'
        });
    } catch (error) {
        console.error('Error in getAllProductsUnderWarranty:', error);
        return res.status(500).json({
            success: false,
            message: `Lỗi khi lấy danh sách sản phẩm đang bảo hành: ${error.message}`,
            data: null
        });
    } finally {
        console.log('=== END getAllProductsUnderWarranty ===');
    }
};
