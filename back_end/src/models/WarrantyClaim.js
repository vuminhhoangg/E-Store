const mongoose = require('mongoose');

const warrantyClaimSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
            required: true
        },
        orderNumber: {
            type: String,
            required: true
        },
        claimNumber: {
            type: String,
            unique: true
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        productName: {
            type: String,
            required: true
        },
        serialNumber: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        images: [
            {
                type: String
            }
        ],
        status: {
            type: String,
            enum: ['pending', 'under_review', 'approved', 'in_progress', 'completed', 'rejected'],
            default: 'pending'
        },
        contactName: {
            type: String,
            required: true
        },
        contactPhone: {
            type: String,
            required: true
        },
        contactEmail: {
            type: String,
            required: true
        },
        contactAddress: {
            type: String,
            required: true
        },
        warrantyStartDate: {
            type: Date,
            required: true
        },
        warrantyEndDate: {
            type: Date,
            required: true
        },
        isWithinWarranty: {
            type: Boolean,
            default: true
        },
        adminNotes: {
            type: String
        },
        repairCost: {
            type: Number,
            default: 0
        },
        isPaid: {
            type: Boolean,
            default: false
        },
        statusHistory: [
            {
                status: {
                    type: String,
                    enum: ['pending', 'under_review', 'approved', 'in_progress', 'completed', 'rejected']
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
    },
    {
        timestamps: true
    }
);

// Tạo claimNumber trước khi lưu
warrantyClaimSchema.pre('save', async function (next) {
    // Nếu đã có claimNumber thì không tạo mới
    if (this.claimNumber) {
        return next();
    }

    // Format: WR-Năm-Tháng-Số thứ tự trong tháng
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    // Tìm claim cuối cùng trong tháng này
    const lastClaim = await this.constructor.findOne({
        claimNumber: { $regex: `^WR-${year}${month}` }
    }).sort({ claimNumber: -1 });

    let sequence = 1;
    if (lastClaim && lastClaim.claimNumber) {
        // Lấy số thứ tự từ claimNumber cuối cùng và tăng lên 1
        const lastSequence = lastClaim.claimNumber.split('-')[2];
        sequence = parseInt(lastSequence, 10) + 1;
    }

    this.claimNumber = `WR-${year}${month}-${sequence.toString().padStart(4, '0')}`;
    next();
});

// Kiểm tra xem sản phẩm có còn trong thời gian bảo hành không khi tạo claim
warrantyClaimSchema.pre('save', function (next) {
    if (this.isNew) {
        const currentDate = new Date();
        this.isWithinWarranty = currentDate >= this.warrantyStartDate && currentDate <= this.warrantyEndDate;
    }
    next();
});

// Thêm phương thức để cập nhật trạng thái và lưu lịch sử
warrantyClaimSchema.methods.updateStatus = function (status, userId, notes = '') {
    this.status = status;

    // Thêm vào lịch sử trạng thái
    this.statusHistory.push({
        status,
        updatedBy: userId,
        notes,
        createdAt: Date.now()
    });
};

const WarrantyClaim = mongoose.model('WarrantyClaim', warrantyClaimSchema);

module.exports = WarrantyClaim; 