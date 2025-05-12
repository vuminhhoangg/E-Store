import BaseModel from "./base.js";
import mongoose from "mongoose";

const WarrantyRequestSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['request', 'approved', 'sending', 'received', 'processing', 'completed', 'rejected'], default: 'request' },
    method: { type: String, default: '' },
    price: { type: Number, default: 0 },
    description: String,
    responseMessage: String,
    endDate: Date,
    serialNumber: { type: String, default: '' },
    orderNumber: { type: String },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    productName: { type: String },
    startDate: { type: Date },
}, {
    timestamps: true,
});

const baseModel = new BaseModel(WarrantyRequestSchema);

export default baseModel.createModel("Warranty");
