import Product from '../models/Product.js';
import httpStatus from 'http-status';

export const createProduct = async (req, res) => {
    try {
        const { name, image, brand, category, description, price, countInStock } = req.body;

        const product = new Product({
            name,
            image,
            brand,
            category,
            description,
            price,
            countInStock
        });

        const createdProduct = await product.save();
        return res.status(httpStatus.CREATED).json({ data: createdProduct, message: 'Product created successfully' });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ data: null, message: error.message });
    }
}

export const updateProduct = async (req, res) => {
    try {
        const { name, image, brand, category, description, price, countInStock } = req.body;

        const product = await Product.findById(req.params.id);

        if (product) {
            product.name = name;
            product.image = image;
            product.brand = brand;
            product.category = category;
            product.description = description;
            product.price = price;
            product.countInStock = countInStock;

            const updatedProduct = await product.save();
            return res.status(httpStatus.OK).json({ data: updatedProduct, message: 'Product updated successfully' });
        } else {
            return res.status(httpStatus.NOT_FOUND).json({ data: null, message: 'Product not found' });
        }
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ data: null, message: error.message });
    }
}

export const getProductList = async (req, res) => {
    try {
        const pageSize = Number(req.query.pageSize) || 10;
        const page = Number(req.query.pageNumber) || 1;

        const count = await Product.countDocuments({});
        const products = await Product.find({})
            .limit(pageSize)
            .skip(pageSize * (page - 1));

        return res.status(httpStatus.OK).json({
            data: { products, page, pages: Math.ceil(count / pageSize) },
            message: 'Product list retrieved successfully'
        });
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ data: null, message: error.message });
    }
}

export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            return res.status(httpStatus.OK).json({ data: product, message: 'Product retrieved successfully' });
        } else {
            return res.status(httpStatus.NOT_FOUND).json({ data: null, message: 'Product not found' });
        }
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ data: null, message: error.message });
    }
}