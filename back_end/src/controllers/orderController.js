import Order from '../models/Order.js';

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
            paidAt,
            warrantyStartDate
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
            warrantyStartDate: warrantyStartDate || null,
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
        const { status, fromDate, toDate, page = 1, limit = 10 } = req.query;

        // Xây dựng query
        let query = {};

        // Lọc theo trạng thái
        if (status && status !== 'all') {
            query.status = status;
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
                deliveryAddress: deliveryAddress
            };
        });

        // Đếm tổng số đơn hàng
        const total = await Order.countDocuments(query);
        console.log(`[OrderController] Tổng số đơn hàng: ${total}`);

        // Trả về kết quả
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
        const order = await Order.findById(orderId)
            .populate('user', 'userName phoneNumber email')
            .populate('items.product', 'name image price');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đơn hàng'
            });
        }

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

        // Cập nhật trạng thái
        order.status = status;

        // Nếu đơn hàng đã hoàn thành, cập nhật ngày hoàn thành
        if (status === 'delivered') {
            order.deliveredAt = Date.now();
        }

        // Nếu đơn hàng bị hủy, cập nhật ngày hủy
        if (status === 'cancelled') {
            order.cancelledAt = Date.now();
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