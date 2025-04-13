import BaseModel from "./base.js";
import mongoose from "mongoose";

const WarrantyRequestSchema = new mongoose.Schema({
    productId: {type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true},
    customerId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    description: String,
    status: {type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending'},
    responseMessage: String,
    processedAt: Date
});

const baseModel = new BaseModel(WarrantyRequestSchema);

export default baseModel.createModel("Warranty");
