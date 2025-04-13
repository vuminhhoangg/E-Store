import mongoose from 'mongoose';
import BaseModel from "./base.js";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    brand: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
        default: 0,
    },
    countInStock: {
        type: Number,
        required: true,
        default: 0,
    },
    rating: {
        type: Number,
        default: 0,
    },
    numReviews: {
        type: Number,
        default: 0,
    },
    numSold: {
        type: Number,
        default: 0,
    },
    warrantyPeriodMonths: {
        type: Number,
        default: 0,
    }
}, {
    timestamps: true,
});

const baseModel = new BaseModel(productSchema);

export default baseModel.createModel("Product");