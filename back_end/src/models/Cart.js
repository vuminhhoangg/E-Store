import mongoose from 'mongoose';
import BaseModel from "./base.js";

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product',
    },
    name: {
        type: String,
        required: true
    },
    image: {
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
        default: 1
    }
});

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    cartItems: [cartItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        default: 0,
    },
}, {
    timestamps: true,
});

const baseModel = new BaseModel(cartSchema);

export default baseModel.createModel("Cart"); 