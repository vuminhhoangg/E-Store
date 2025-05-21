import Warranty from '../models/Warranty.js';
import httpStatus from 'http-status';
import Product from "../models/Product.js";
import Order from '../models/Order.js';

// Create a new warranty request
export const createWarrantyRequest = async (req, res) => {
    try {
        console.log('[createWarrantyRequest] Đang tạo yêu cầu bảo hành mới với dữ liệu:', req.body);

        // Lấy dữ liệu từ request body
        const {
            productId,
            description,
            status = 'request',
            contactName,
            contactPhone,
            contactAddress,
            images = []
        } = req.body;

        // Lấy ID của user hiện tại từ middleware protect
        const customerId = req.user._id;
        console.log('[createWarrantyRequest] User ID:', customerId);

        // Kiểm tra sản phẩm tồn tại
        const product = await Product.findById(productId);
        if (!product) {
            console.log('[createWarrantyRequest] Không tìm thấy sản phẩm với ID:', productId);
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Sản phẩm không tồn tại'
            });
        }

        console.log('[createWarrantyRequest] Đã tìm thấy sản phẩm:', product.name);

        // Tạo yêu cầu bảo hành mới
        const warrantyData = {
            productId,
            customerId,
            description,
            status,
            productName: product.name,
            serialNumber: product.serialNumber || 'N/A',
            endDate: new Date(Date.now() + (product.warrantyPeriodMonths || 12) * 30 * 24 * 60 * 60 * 1000),
            startDate: new Date(),
            images,
            contactName,
            contactPhone,
            contactAddress,
        };

        console.log('[createWarrantyRequest] Dữ liệu bảo hành sẽ lưu:', warrantyData);

        const warrantyRequest = await Warranty.create(warrantyData);
        console.log('[createWarrantyRequest] Đã tạo bảo hành thành công với ID:', warrantyRequest._id);

        return res.status(httpStatus.CREATED).json({
            success: true,
            data: warrantyRequest,
            message: 'Yêu cầu bảo hành đã được tạo thành công'
        });
    } catch (error) {
        console.error('[createWarrantyRequest] Lỗi khi tạo yêu cầu bảo hành:', error.message);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            data: null,
            message: error.message
        });
    }
};

// Get all warranty requests
export const getAllWarrantyRequests = async (req, res) => {
    try {
        console.log('[getAllWarrantyRequests] Đang lấy danh sách bảo hành');

        // Lấy tham số phân trang từ query params
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const currentDate = new Date();

        // Tạo query
        let query = {
            // Chỉ lấy các yêu cầu bảo hành còn trong thời hạn
            endDate: { $gte: currentDate }
        };

        // Nếu có status, thêm vào query
        if (status && status !== 'all') {
            query.status = status;
        }

        console.log('[getAllWarrantyRequests] Query:', query);

        // Đếm tổng số bản ghi thỏa mãn điều kiện
        const total = await Warranty.countDocuments(query);
        console.log('[getAllWarrantyRequests] Tổng số bản ghi:', total);

        // Định nghĩa thứ tự ưu tiên cho các trạng thái
        const statusPriority = {
            'request': 1,      // Yêu cầu mới ưu tiên cao nhất
            'approved': 2,     // Đã duyệt
            'sending': 3,      // Đang gửi đi
            'received': 4,     // Đã nhận
            'processing': 5,   // Đang xử lý
            'completed': 6,    // Hoàn thành
            'rejected': 7,     // Từ chối
            'pending': 8       // Chờ xử lý ưu tiên thấp nhất
        };

        // Tìm TẤT CẢ danh sách bảo hành để sắp xếp trước khi phân trang
        const allWarrantyRequests = await Warranty.find(query)
            .populate('productId', 'name price warrantyPeriodMonths')
            .populate('customerId', 'name email phone userName');

        console.log('[getAllWarrantyRequests] Tìm thấy tổng cộng', allWarrantyRequests.length, 'bản ghi');

        // Lọc bỏ các sản phẩm có thời gian bảo hành 0 tháng
        const filteredWarrantyRequests = allWarrantyRequests.filter(warranty => {
            const warrantyPeriodMonths = warranty.productId?.warrantyPeriodMonths || warranty.warrantyPeriodMonths || 0;
            return warrantyPeriodMonths > 0;
        });

        // Sắp xếp danh sách bảo hành theo thứ tự ưu tiên trạng thái
        const sortedWarrantyRequests = filteredWarrantyRequests.sort((a, b) => {
            const priorityA = statusPriority[a.status] || 9;
            const priorityB = statusPriority[b.status] || 9;

            if (priorityA === priorityB) {
                // Nếu cùng trạng thái thì sắp xếp theo thời gian cập nhật mới nhất
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }

            return priorityA - priorityB;
        });

        // Áp dụng phân trang sau khi đã sắp xếp
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedWarrantyRequests = sortedWarrantyRequests.slice(startIndex, endIndex);

        console.log('[getAllWarrantyRequests] Trả về', paginatedWarrantyRequests.length, 'bản ghi cho trang', page);

        // Format response để phù hợp với frontend
        const response = {
            success: true,
            data: paginatedWarrantyRequests,
            total: total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(total / limit),
            message: 'Warranty requests retrieved successfully'
        };

        console.log('[getAllWarrantyRequests] Trả về response thành công');
        return res.status(httpStatus.OK).json(response);
    } catch (error) {
        console.error('[getAllWarrantyRequests] Lỗi:', error.message);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            data: null,
            message: error.message
        });
    }
};

// Get a warranty request by ID
export const getWarrantyRequestById = async (req, res) => {
    try {
        console.log('[getWarrantyRequestById] Lấy thông tin bảo hành với ID:', req.params.id);
        const { id } = req.params;

        const warrantyRequest = await Warranty.findById(id)
            .populate('productId')
            .populate('customerId')
            .populate({
                path: 'orderId',
                select: '_id orderNumber shippingAddress items'
            });

        if (!warrantyRequest) {
            console.log('[getWarrantyRequestById] Không tìm thấy yêu cầu bảo hành');
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Không tìm thấy yêu cầu bảo hành'
            });
        }

        console.log('[getWarrantyRequestById] Đã tìm thấy bảo hành:', {
            id: warrantyRequest._id,
            status: warrantyRequest.status,
            productName: warrantyRequest.productName,
            hasOrderId: !!warrantyRequest.orderId
        });

        if (warrantyRequest.orderId) {
            console.log('[getWarrantyRequestById] Thông tin đơn hàng:', {
                id: warrantyRequest.orderId._id,
                orderNumber: warrantyRequest.orderId.orderNumber,
                hasShippingAddress: !!warrantyRequest.orderId.shippingAddress
            });

            if (warrantyRequest.orderId.shippingAddress) {
                console.log('[getWarrantyRequestById] Thông tin giao hàng:', {
                    fullName: warrantyRequest.orderId.shippingAddress.fullName,
                    phone: warrantyRequest.orderId.shippingAddress.phone,
                    address: warrantyRequest.orderId.shippingAddress.address,
                    district: warrantyRequest.orderId.shippingAddress.district,
                    city: warrantyRequest.orderId.shippingAddress.city
                });
            }
        }

        return res.status(httpStatus.OK).json({
            success: true,
            data: warrantyRequest,
            message: 'Lấy thông tin bảo hành thành công'
        });
    } catch (error) {
        console.error('[getWarrantyRequestById] Lỗi:', error.message);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            data: null,
            message: error.message
        });
    }
};

export const getWarrantyRequestByCustomerId = async (req, res) => {
    try {
        console.log('[getWarrantyRequestByCustomerId] Đang lấy danh sách bảo hành của người dùng');

        // Lấy ID người dùng hiện tại từ req.user được cung cấp bởi middleware protect
        const customerId = req.user._id;
        console.log('[getWarrantyRequestByCustomerId] ID người dùng:', customerId);

        // Lấy tham số phân trang từ query params
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const currentDate = new Date();

        // Tính toán bỏ qua bao nhiêu records
        const skip = (page - 1) * limit;

        // Tạo query với customerId và chỉ lấy các yêu cầu còn trong thời hạn bảo hành
        let query = {
            customerId: customerId,
            // Chỉ lấy các yêu cầu bảo hành còn trong thời hạn hoặc không có endDate
            $or: [
                { endDate: { $gte: currentDate } },
                { endDate: null }
            ]
        };

        // Nếu có status, thêm vào query
        if (status && status !== 'all') {
            query.status = status;
        }

        console.log('[getWarrantyRequestByCustomerId] Query:', query);

        // Đếm tổng số bản ghi thỏa mãn điều kiện
        const total = await Warranty.countDocuments(query);
        console.log('[getWarrantyRequestByCustomerId] Tổng số bản ghi:', total);

        // Tìm danh sách bảo hành của người dùng với phân trang
        const warrantyRequests = await Warranty.find(query)
            .populate('productId')
            .populate('customerId', 'name email phone userName')
            .populate('orderId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        console.log('[getWarrantyRequestByCustomerId] Tìm thấy', warrantyRequests.length, 'bản ghi');
        if (warrantyRequests.length > 0) {
            console.log('[getWarrantyRequestByCustomerId] Mẫu bản ghi đầu tiên:', {
                id: warrantyRequests[0]._id,
                productName: warrantyRequests[0].productName,
                description: warrantyRequests[0].description,
                status: warrantyRequests[0].status,
                endDate: warrantyRequests[0].endDate || 'không có',
                hasProductId: !!warrantyRequests[0].productId,
                productIdData: warrantyRequests[0].productId ? {
                    id: warrantyRequests[0].productId._id,
                    name: warrantyRequests[0].productId.name
                } : 'không có'
            });
        }

        // Format response để phù hợp với frontend
        const response = {
            success: true,
            data: warrantyRequests,
            total: total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(total / limit),
            message: 'Warranty requests retrieved successfully'
        };

        console.log('[getWarrantyRequestByCustomerId] Trả về response thành công');
        return res.status(httpStatus.OK).json(response);
    } catch (error) {
        console.error('[getWarrantyRequestByCustomerId] Lỗi:', error.message);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            data: null,
            message: error.message
        });
    }
};

// Update a warranty request
export const updateWarrantyRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, description, method, price, responseMessage } = req.body;

        console.log('[updateWarrantyRequest] Cập nhật yêu cầu bảo hành với ID:', id);
        console.log('[updateWarrantyRequest] Dữ liệu cập nhật:', req.body);

        // Tìm warranty request theo _id hoặc productId
        let warrantyRequest = await Warranty.findById(id);

        if (!warrantyRequest) {
            // Thử tìm theo productId
            warrantyRequest = await Warranty.findOne({ productId: id });
        }

        if (!warrantyRequest) {
            console.log('[updateWarrantyRequest] Không tìm thấy yêu cầu bảo hành');
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                data: null,
                message: 'Không tìm thấy yêu cầu bảo hành'
            });
        }

        console.log('[updateWarrantyRequest] Đã tìm thấy yêu cầu bảo hành ID:', warrantyRequest._id);

        // Cập nhật các trường nếu có
        if (status !== undefined) warrantyRequest.status = status;
        if (responseMessage !== undefined) warrantyRequest.responseMessage = responseMessage;
        if (method !== undefined) warrantyRequest.method = method;
        // Đảm bảo price được xử lý đúng, kể cả khi là 0
        if (price !== undefined) {
            console.log('[updateWarrantyRequest] Cập nhật giá tiền:', price, 'kiểu:', typeof price);
            warrantyRequest.price = Number(price); // Đảm bảo giá trị price là số
        }
        if (description !== undefined) warrantyRequest.description = description;

        const updatedWarrantyRequest = await warrantyRequest.save();
        console.log('[updateWarrantyRequest] Đã cập nhật thành công');

        return res.status(httpStatus.OK).json({
            success: true,
            data: updatedWarrantyRequest,
            message: 'Yêu cầu bảo hành đã được cập nhật thành công'
        });
    } catch (error) {
        console.error('[updateWarrantyRequest] Lỗi:', error.message);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
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
            // Kiểm tra thời gian bảo hành phải lớn hơn 0
            if (warranty.productId && warranty.productId.warrantyPeriodMonths > 0 && warranty.endDate && currentDate <= new Date(warranty.endDate)) {
                // Sử dụng trường startDate nếu có, nếu không thì dùng createdAt
                const startDate = warranty.startDate || warranty.createdAt;
                const endDate = new Date(warranty.endDate);

                // Tính thời gian bảo hành còn lại (ngày)
                const remainingTime = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));

                // Chỉ thêm vào danh sách nếu còn thời gian bảo hành
                if (remainingTime > 0) {
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
            }
        });

        // 2. Lấy sản phẩm từ đơn hàng có kích hoạt bảo hành
        console.log('Đang lấy dữ liệu từ đơn hàng đã kích hoạt bảo hành...');
        const orders = await Order.find({
            warrantyActivated: true
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
                if (item.warrantyStartDate && item.warrantyEndDate && item.warrantyPeriodMonths > 0) {
                    const startDate = new Date(item.warrantyStartDate);
                    const endDate = new Date(item.warrantyEndDate);

                    // Chỉ thêm vào danh sách nếu sản phẩm vẫn trong thời gian bảo hành
                    if (currentDate <= endDate) {
                        // Tính thời gian bảo hành còn lại (tính theo ngày)
                        const remainingTime = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));

                        // Nếu còn thời gian bảo hành (remainingTime > 0), mới thêm vào danh sách
                        if (remainingTime > 0) {
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
