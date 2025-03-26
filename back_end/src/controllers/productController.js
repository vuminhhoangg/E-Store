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
        return res.status(httpStatus.CREATED).json(createdProduct);
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
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
            return res.status(httpStatus.OK).json(updatedProduct);
        } else {
            return res.status(httpStatus.NOT_FOUND).json({ message: 'Product not found' });
        }
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}

export const getProductList = async (req, res) => {
    try {
        const products = await Product.find({});
        return res.status(httpStatus.OK).json(products);
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}

export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            return res.status(httpStatus.OK).json(product);
        } else {
            return res.status(httpStatus.NOT_FOUND).json({ message: 'Product not found' });
        }
    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
}