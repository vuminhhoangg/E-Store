import Order from '../models/Order.js';
import mongoose from 'mongoose';
import Warranty from '../models/Warranty.js';

// Tạo đơn hàng mới
export const createOrder = async (req, res) => {
    try {
        const {
            userId,
            items,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            shippingPrice,
            totalPrice,
            notes,
            isPaid,
            paidAt
        } = req.body;

        console.log('Received order data:', JSON.stringify(req.body, null, 2));

        // Kiểm tra dữ liệu đầu vào
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có sản phẩm trong đơn hàng'
            });
        }

        // Tạo đơn hàng mới
        const order = new Order({
            userId, // Đây là ObjectId của người dùng
            items: items.map(item => ({
                productId: item.productId, // Đây là ObjectId của sản phẩm
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                warrantyPeriodMonths: item.warrantyPeriodMonths || 0,
                image: item.image // Thêm trường image nếu có
            })),
            shippingAddress,
            paymentMethod,
            itemsPrice,
            shippingPrice,
            totalPrice,
            notes: notes || '',
            isPaid: isPaid || false,
            paidAt: paidAt || null,
            warrantyActivated: false, // Mặc định là false, chỉ kích hoạt khi đơn hàng đã giao
            status: 'pending'
        });

        console.log('Created order object:', order);

        // Lưu đơn hàng
        const createdOrder = await order.save();
        console.log('Saved order:', createdOrder);
        console.log('Order ID for response:', createdOrder._id);
        console.log('Order structure for response:', {
            _id: createdOrder._id,
            userId: createdOrder.userId,
            items: createdOrder.items.length,
            totalPrice: createdOrder.totalPrice,
            status: createdOrder.status
        });

        // Chuẩn bị dữ liệu phản hồi
        const responseData = {
            success: true,
            message: 'Tạo đơn hàng thành công',
            data: createdOrder
        };

        console.log('Response structure:', {
            success: responseData.success,
            message: responseData.message,
            data: {
                _id: responseData.data._id,
                hasId: Boolean(responseData.data._id)
            }
        });

        return res.status(201).json(responseData);
    } catch (error) {
        console.error('Lỗi khi tạo đơn hàng:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi, không thể tạo đơn hàng',
            error: error.message
        });
    }
};

// Lấy tất cả đơn hàng (Admin)
export const getAllOrders = async (req, res) => {
    try {
        console.log('[OrderController] Đang lấy danh sách đơn hàng, params:', req.query);
        console.log('[OrderController] User yêu cầu:', req.user._id, 'isAdmin:', req.user.isAdmin);

        // Lấy các tham số truy vấn
        const { status, fromDate, toDate, page = 1, limit = 10, search } = req.query;

        // Xây dựng query
        let query = {};

        // Lọc theo trạng thái
        if (status && status !== 'all') {
            query.status = status;
        }

        // Tìm kiếm theo từ khóa
        if (search) {
            console.log('[OrderController] Tìm kiếm theo từ khóa:', search);

            // Sử dụng $or để tìm kiếm theo mã đơn hàng, tên khách hàng hoặc số điện thoại
            const searchRegex = new RegExp(search, 'i');

            // Cần populate userId trước khi tìm kiếm
            query.$or = [
                { _id: search.match(/^[0-9a-fA-F]{24}$/) ? search : null }, // Nếu search là ObjectId hợp lệ
                { orderNumber: searchRegex },
            ];

            // Thêm điều kiện tìm kiếm liên quan đến người dùng
            // Lưu ý: MongoDB không cho phép truy vấn trực tiếp vào trường của field populate
            // Nên phải làm thủ công bằng cách tìm userId trước
            try {
                const users = await mongoose.model('User').find({
                    $or: [
                        { userName: searchRegex },
                        { phoneNumber: searchRegex }
                    ]
                }).select('_id');

                if (users.length > 0) {
                    const userIds = users.map(user => user._id);
                    // Thêm điều kiện userId vào $or
                    query.$or.push({ userId: { $in: userIds } });
                }

                console.log('[OrderController] Tìm thấy users khớp với từ khóa:', users.length);
            } catch (err) {
                console.error('[OrderController] Lỗi khi tìm kiếm users:', err);
            }
        }

        // Lọc theo khoảng thời gian
        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) {
                query.createdAt.$gte = new Date(fromDate);
            }
            if (toDate) {
                // Thêm 1 ngày để bao gồm cả ngày kết thúc
                const endDate = new Date(toDate);
                endDate.setDate(endDate.getDate() + 1);
                query.createdAt.$lte = endDate;
            }
        }

        console.log('[OrderController] Query điều kiện:', JSON.stringify(query));

        // Tính toán phân trang
        const pageNum = Number(page);
        const pageSize = Number(limit);
        const skip = (pageNum - 1) * pageSize;

        console.log(`[OrderController] Phân trang: page=${pageNum}, limit=${pageSize}, skip=${skip}`);

        // Thực hiện truy vấn
        const ordersQuery = Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);

        // Thử populate theo userId
        try {
            ordersQuery.populate('userId', 'userName phoneNumber email');
        } catch (populateError) {
            console.error('[OrderController] Lỗi khi populate userId:', populateError);
        }

        const orders = await ordersQuery;
        console.log(`[OrderController] Đã tìm thấy ${orders.length} đơn hàng`);
        console.log(`[OrderController] Đơn hàng đầu tiên:`, orders[0] || 'Không có đơn hàng');

        // Chuyển đổi dữ liệu để tương thích với client
        const transformedOrders = orders.map(order => {
            // Lấy thông tin user từ userId (nếu đã populate) hoặc giá trị mặc định
            const userName = order.userId && typeof order.userId === 'object' && order.userId.userName
                ? order.userId.userName
                : 'Không xác định';

            // Tạo địa chỉ giao hàng từ thông tin shippingAddress
            let deliveryAddress = 'Không có địa chỉ';
            if (order.shippingAddress) {
                const { address, ward, district, city } = order.shippingAddress;
                const addressParts = [address, ward, district, city].filter(Boolean);
                if (addressParts.length > 0) {
                    deliveryAddress = addressParts.join(', ');
                }
            }

            return {
                _id: order._id,
                user: {
                    _id: order.userId && typeof order.userId === 'object' ? order.userId._id : order.userId,
                    userName: userName
                },
                totalAmount: order.totalPrice || 0,
                items: order.items || [],
                status: order.status,
                paymentMethod: order.paymentMethod,
                createdAt: order.createdAt,
                deliveryAddress: deliveryAddress,
                shippingAddress: order.shippingAddress || null
            };
        });

        // Đếm tổng số đơn hàng
        const total = await Order.countDocuments(query);
        console.log(`[OrderController] Tổng số đơn hàng: ${total}`);

        // Trả về kết quả
        console.log('Đơn hàng đầu tiên sau khi transform:', transformedOrders[0] || 'Không có đơn hàng');
        return res.status(200).json({
            success: true,
            count: transformedOrders.length,
            total,
            totalPages: Math.ceil(total / pageSize),
            currentPage: pageNum,
            data: transformedOrders
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách đơn hàng:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi, không thể lấy danh sách đơn hàng',
            error: error.message
        });
    }
};

// Lấy chi tiết đơn hàng theo ID (Admin)
export const getOrderById = async (req, res) => {
    try {
        const orderId = req.params.id;
        console.log('Đang lấy chi tiết đơn hàng với ID:', orderId);

        const order = await Order.findById(orderId)
            .populate('userId', 'userName phoneNumber email')
            .populate('items.productId', 'name image price');

        if (!order) {
            console.log('Không tìm thấy đơn hàng với ID:', orderId);
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        console.log('Đã tìm thấy đơn hàng:', orderId, 'thông tin cơ bản:', {
            _id: order._id,
            userId: order.userId,
            totalPrice: order.totalPrice,
            status: order.status,
            hasShippingAddress: !!order.shippingAddress
        });

        return res.status(200).json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi, không thể lấy chi tiết đơn hàng'
        });
    }
};

// Cập nhật trạng thái đơn hàng (Admin)
export const updateOrderStatus = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        // Kiểm tra status có hợp lệ không
        const validStatuses = ['pending', 'processing', 'shipping', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái đơn hàng không hợp lệ'
            });
        }

        // Tìm đơn hàng
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Cập nhật trạng thái sử dụng phương thức updateStatus
        order.updateStatus(status, req.user._id, req.body.notes || '');

        // Nếu đơn hàng đã hoàn thành (delivered), tự động kích hoạt bảo hành
        if (status === 'delivered') {
            console.log(`[OrderController] Đơn hàng ${orderId} đã giao thành công, tiến hành kích hoạt bảo hành`);
            console.log(`[OrderController] Trạng thái trước khi cập nhật: ${order.status}, Thời gian giao: ${order.deliveredAt}`);
            console.log(`[OrderController] Thông tin bảo hành hiện tại: warrantyActivated=${order.warrantyActivated}, warrantyStartDate=${order.warrantyStartDate}`);

            // Đảm bảo đã cập nhật thời gian giao hàng
            if (!order.deliveredAt) {
                order.deliveredAt = Date.now();
                console.log(`[OrderController] Đã cập nhật thời gian giao hàng: ${order.deliveredAt}`);
            }

            // Kích hoạt bảo hành cho các sản phẩm trong đơn hàng
            console.log(`[OrderController] Gọi phương thức activateWarranty cho đơn hàng ${orderId}`);
            order.activateWarranty();

            console.log(`[OrderController] Sau khi gọi activateWarranty: warrantyActivated=${order.warrantyActivated}, warrantyStartDate=${order.warrantyStartDate}`);
            console.log(`[OrderController] Số lượng sản phẩm trong đơn hàng: ${order.items.length}`);

            // In thông tin chi tiết từng sản phẩm trong đơn hàng
            order.items.forEach((item, index) => {
                console.log(`[OrderController] Sản phẩm ${index + 1}: ${item.name}, warrantyPeriodMonths=${item.warrantyPeriodMonths}, serialNumber=${item.serialNumber || 'N/A'}`);
                console.log(`[OrderController] Thời gian bảo hành: ${item.warrantyStartDate} - ${item.warrantyEndDate}`);
            });

            // Thêm các sản phẩm có bảo hành vào bảng Warranty
            try {
                console.log(`[OrderController] Bắt đầu thêm sản phẩm vào bảng Warranty`);

                // Populate thông tin sản phẩm để lấy thêm chi tiết
                console.log(`[OrderController] Populate thông tin sản phẩm`);
                await order.populate('items.productId');
                console.log(`[OrderController] Đã hoàn thành populate`);

                // Duyệt qua từng sản phẩm trong đơn hàng
                let warrantyCreatedCount = 0;
                for (const item of order.items) {
                    // Chỉ tạo bảo hành cho sản phẩm có thời gian bảo hành > 0
                    if (item.warrantyPeriodMonths > 0) {
                        console.log(`[OrderController] Đang tạo bảo hành cho sản phẩm: ${item.name}`);
                        console.log(`[OrderController] Thông tin sản phẩm: productId=${item.productId}, warrantyPeriodMonths=${item.warrantyPeriodMonths}`);

                        // Tính ngày kết thúc bảo hành
                        const startDate = new Date(order.deliveredAt);
                        const endDate = new Date(startDate);
                        endDate.setMonth(endDate.getMonth() + item.warrantyPeriodMonths);
                        console.log(`[OrderController] Thời gian bảo hành: ${startDate.toISOString()} - ${endDate.toISOString()}`);

                        // Lấy tên sản phẩm từ item hoặc từ product
                        const productName = item.name || (item.productId && item.productId.name ? item.productId.name : 'Sản phẩm không tên');
                        console.log(`[OrderController] Tên sản phẩm: ${productName}`);

                        // Tạo mô tả chi tiết
                        const detailedDescription = `Bảo hành tự động cho ${productName} từ đơn hàng ${order.orderNumber}. Thời hạn bảo hành ${item.warrantyPeriodMonths} tháng.`;

                        // Chuẩn bị dữ liệu warranty để kiểm tra
                        const warrantyData = {
                            productId: item.productId,
                            customerId: order.userId,
                            status: 'approved',
                            description: detailedDescription,
                            endDate: endDate,
                            method: 'standard',
                            price: 0,
                            serialNumber: item.serialNumber || '',
                            orderNumber: order.orderNumber,
                            orderId: order._id,
                            productName: productName,
                            startDate: startDate
                        };
                        console.log(`[OrderController] Dữ liệu warranty để lưu:`, JSON.stringify(warrantyData, null, 2));

                        // Tạo entry mới trong bảng Warranty với nhiều thông tin hơn
                        const newWarranty = await Warranty.create(warrantyData);
                        console.log(`[OrderController] Đã tạo bảo hành thành công với ID: ${newWarranty._id}`);
                        warrantyCreatedCount++;

                        console.log(`[OrderController] Đã tạo bảo hành cho sản phẩm ${productName} từ đơn hàng ${order.orderNumber}, thời hạn đến ${endDate.toISOString()}`);
                    } else {
                        console.log(`[OrderController] Bỏ qua sản phẩm ${item.name} vì không có thời gian bảo hành`);
                    }
                }
                console.log(`[OrderController] Hoàn thành việc tạo ${warrantyCreatedCount} bảo hành cho đơn hàng ${orderId}`);
            } catch (warrantyError) {
                console.error(`[OrderController] Lỗi khi tạo bảo hành trong bảng Warranty:`, warrantyError);
                console.error(`[OrderController] Chi tiết lỗi:`, warrantyError.message);
                console.error(`[OrderController] Stack trace:`, warrantyError.stack);
                // Không trả về lỗi này ra response, chỉ ghi log
            }
        }

        // Lưu thay đổi
        await order.save();

        return res.status(200).json({
            success: true,
            message: `Đã cập nhật trạng thái đơn hàng thành ${status}`,
            data: order
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi, không thể cập nhật trạng thái đơn hàng'
        });
    }
};

// Lấy danh sách đơn hàng của người dùng đang đăng nhập
export const getUserOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        console.log('[OrderController] Đang lấy đơn hàng của người dùng:', userId);

        // Tìm tất cả đơn hàng của người dùng
        const orders = await Order.find({ userId })
            .populate('items.productId', 'name image price')
            .sort({ createdAt: -1 });

        console.log(`[OrderController] Đã tìm thấy ${orders.length} đơn hàng của người dùng ${userId}`);

        // Chuyển đổi dữ liệu để phù hợp với client
        const transformedOrders = orders.map(order => {
            // Xử lý thông tin items để bao gồm cả hình ảnh và tên sản phẩm
            const transformedItems = order.items.map(item => {
                const productInfo = item.productId || {};
                return {
                    productId: item.productId ? item.productId._id : item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: productInfo.image || '',
                    warrantyPeriodMonths: item.warrantyPeriodMonths
                };
            });

            return {
                _id: order._id,
                items: transformedItems,
                totalAmount: order.totalPrice || 0,
                totalPrice: order.totalPrice || 0,
                itemsPrice: order.itemsPrice || 0,
                shippingPrice: order.shippingPrice || 0,
                status: order.status,
                paymentMethod: order.paymentMethod,
                createdAt: order.createdAt,
                updatedAt: order.updatedAt,
                shippingAddress: order.shippingAddress || null,
                isPaid: order.isPaid || false,
                paidAt: order.paidAt || null,
                deliveredAt: order.deliveredAt || null
            };
        });

        return res.status(200).json({
            success: true,
            count: transformedOrders.length,
            data: transformedOrders
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách đơn hàng của người dùng:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi, không thể lấy danh sách đơn hàng',
            error: error.message
        });
    }
};

// Kích hoạt bảo hành cho đơn hàng
export const startOrderWarranty = async (req, res) => {
    try {
        const orderId = req.params.id;
        console.log(`[OrderController] Đang kích hoạt bảo hành cho đơn hàng: ${orderId}`);

        // Tìm đơn hàng theo ID
        const order = await Order.findById(orderId);

        if (!order) {
            console.log(`[OrderController] Không tìm thấy đơn hàng với ID: ${orderId}`);
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

        // Kiểm tra nếu đơn hàng đã giao thành công
        if (order.status !== 'delivered') {
            console.log(`[OrderController] Đơn hàng chưa được giao hàng: ${orderId}, status: ${order.status}`);
            return res.status(400).json({
                success: false,
                message: 'Không thể kích hoạt bảo hành cho đơn hàng chưa giao thành công'
            });
        }

        // Kích hoạt bảo hành cho đơn hàng
        order.activateWarranty();
        await order.save();

        console.log(`[OrderController] Đã kích hoạt bảo hành thành công cho đơn hàng: ${orderId}`);

        return res.status(200).json({
            success: true,
            message: 'Kích hoạt bảo hành thành công',
            data: order
        });
    } catch (error) {
        console.error(`[OrderController] Lỗi khi kích hoạt bảo hành:`, error);
        return res.status(500).json({
            success: false,
            message: `Đã xảy ra lỗi khi kích hoạt bảo hành: ${error.message}`
        });
    }
}; 