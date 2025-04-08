import Order from '../models/Order.js';

// Lấy tất cả đơn hàng (Admin)
export const getAllOrders = async (req, res) => {
    try {
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

        // Tính toán phân trang
        const pageNum = Number(page);
        const pageSize = Number(limit);
        const skip = (pageNum - 1) * pageSize;

        // Thực hiện truy vấn
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .populate('user', 'userName phoneNumber email');

        // Đếm tổng số đơn hàng
        const total = await Order.countDocuments(query);

        // Trả về kết quả
        return res.status(200).json({
            success: true,
            count: orders.length,
            total,
            totalPages: Math.ceil(total / pageSize),
            currentPage: pageNum,
            data: orders
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách đơn hàng:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi, không thể lấy danh sách đơn hàng'
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