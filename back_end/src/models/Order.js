import mongoose from 'mongoose';
import BaseModel from "./base.js";

const orderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    image: {
        type: String
    },
    warrantyPeriodMonths: {
        type: Number,
        default: 0
    },
    serialNumber: {
        type: String,
        default: null
    },
    warrantyStartDate: {
        type: Date,
        default: null
    },
    warrantyEndDate: {
        type: Date,
        default: null
    }
});

const shippingAddressSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    ward: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    }
});

const paymentResultSchema = new mongoose.Schema({
    id: {
        type: String
    },
    status: {
        type: String
    },
    update_time: {
        type: String
    },
    email_address: {
        type: String
    },
    transactionId: {
        type: String
    },
    paymentMethod: {
        type: String
    }
});

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderNumber: {
        type: String,
        unique: true
    },
    items: [orderItemSchema],
    shippingAddress: shippingAddressSchema,
    paymentMethod: {
        type: String,
        required: true,
        enum: ['cod', 'banking', 'momo', 'zalopay', 'paypal']
    },
    paymentResult: paymentResultSchema,
    itemsPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    isPaid: {
        type: Boolean,
        required: true,
        default: false
    },
    paidAt: {
        type: Date
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'],
        default: 'pending'
    },
    deliveredAt: {
        type: Date
    },
    notes: {
        type: String
    },
    warrantyActivated: {
        type: Boolean,
        default: false
    },
    warrantyStartDate: {
        type: Date
    },
    statusHistory: [
        {
            status: {
                type: String,
                enum: ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled']
            },
            updatedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            notes: {
                type: String
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, {
    timestamps: true
});

// Tạo orderNumber trước khi lưu
orderSchema.pre('save', async function (next) {
    // Nếu đã có orderNumber thì không tạo mới
    if (this.orderNumber) {
        return next();
    }

    // Format: ES-Năm-Tháng-Số thứ tự trong tháng
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    // Tìm order cuối cùng trong tháng này
    const lastOrder = await this.constructor.findOne({
        orderNumber: { $regex: `^ES-${year}${month}` }
    }).sort({ orderNumber: -1 });

    let sequence = 1;
    if (lastOrder && lastOrder.orderNumber) {
        // Lấy số thứ tự từ orderNumber cuối cùng và tăng lên 1
        const lastSequence = lastOrder.orderNumber.split('-')[2];
        sequence = parseInt(lastSequence, 10) + 1;
    }

    this.orderNumber = `ES-${year}${month}-${sequence.toString().padStart(4, '0')}`;
    next();
});

// Cập nhật các trường thời gian bảo hành khi kích hoạt
orderSchema.methods.activateWarranty = function () {
    const currentDate = new Date();
    this.warrantyActivated = true;
    this.warrantyStartDate = currentDate;

    // Cập nhật thời gian bảo hành cho từng sản phẩm
    this.items.forEach(item => {
        if (item.warrantyPeriodMonths > 0) {
            item.warrantyStartDate = currentDate;

            // Tính ngày kết thúc bảo hành
            const endDate = new Date(currentDate);
            endDate.setMonth(endDate.getMonth() + item.warrantyPeriodMonths);
            item.warrantyEndDate = endDate;

            // Tạo mã serial nếu chưa có
            if (!item.serialNumber) {
                // Format: Năm+Tháng+ngẫu nhiên 6 số
                const year = currentDate.getFullYear().toString().slice(-2);
                const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
                const random = Math.floor(Math.random() * 900000 + 100000).toString();
                item.serialNumber = `ES${year}${month}${random}`;
            }
        }
    });
};

// Thêm phương thức để cập nhật trạng thái và lưu lịch sử
orderSchema.methods.updateStatus = function (status, userId, notes = '') {
    this.status = status;

    // Thêm vào lịch sử trạng thái
    this.statusHistory.push({
        status,
        updatedBy: userId,
        notes,
        createdAt: Date.now()
    });

    // Cập nhật thời gian giao hàng nếu trạng thái là 'delivered'
    if (status === 'delivered') {
        this.deliveredAt = Date.now();
    }
};

const baseModel = new BaseModel(orderSchema);

export default baseModel.createModel("Order");