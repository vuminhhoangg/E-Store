import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// @desc    Lấy giỏ hàng của người dùng
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
    try {
        const userId = req.user._id;

        let cart = await Cart.findOne({ user: userId }).populate('cartItems.product');

        if (!cart) {
            cart = new Cart({
                user: userId,
                cartItems: [],
                totalAmount: 0
            });
            await cart.save();
        }

        res.status(200).json({
            success: true,
            data: cart
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy thông tin giỏ hàng'
        });
    }
};

// @desc    Thêm sản phẩm vào giỏ hàng
// @route   POST /api/cart
// @access  Private
export const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user._id;

        // Kiểm tra sản phẩm tồn tại
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Kiểm tra số lượng tồn kho
        if (product.countInStock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Sản phẩm không đủ số lượng trong kho'
            });
        }

        // Tìm hoặc tạo giỏ hàng
        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({
                user: userId,
                cartItems: [],
                totalAmount: 0
            });
        }

        // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
        const cartItemIndex = cart.cartItems.findIndex(
            item => item.product.toString() === productId
        );

        if (cartItemIndex > -1) {
            // Nếu đã có, cập nhật số lượng
            cart.cartItems[cartItemIndex].quantity += quantity;
        } else {
            // Nếu chưa có, thêm mới
            cart.cartItems.push({
                product: productId,
                name: product.name,
                image: product.image,
                price: product.price,
                quantity
            });
        }

        // Tính lại tổng tiền
        cart.totalAmount = cart.cartItems.reduce(
            (total, item) => total + item.price * item.quantity, 0
        );

        await cart.save();

        res.status(200).json({
            success: true,
            data: cart
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể thêm sản phẩm vào giỏ hàng'
        });
    }
};

// @desc    Cập nhật số lượng sản phẩm trong giỏ hàng
// @route   PUT /api/cart/:productId
// @access  Private
export const updateCartItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        const userId = req.user._id;

        if (!productId || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin sản phẩm hoặc số lượng'
            });
        }

        // Kiểm tra số lượng hợp lệ
        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng phải lớn hơn 0'
            });
        }

        // Kiểm tra sản phẩm tồn tại
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Kiểm tra số lượng tồn kho
        if (product.countInStock < quantity) {
            return res.status(400).json({
                success: false,
                message: 'Sản phẩm không đủ số lượng trong kho'
            });
        }

        // Tìm giỏ hàng
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giỏ hàng'
            });
        }

        // Tìm sản phẩm trong giỏ hàng
        const cartItemIndex = cart.cartItems.findIndex(
            item => item.product.toString() === productId
        );

        if (cartItemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Sản phẩm không có trong giỏ hàng'
            });
        }

        // Cập nhật số lượng
        cart.cartItems[cartItemIndex].quantity = quantity;

        // Tính lại tổng tiền
        cart.totalAmount = cart.cartItems.reduce(
            (total, item) => total + item.price * item.quantity, 0
        );

        // Lưu giỏ hàng đã cập nhật
        const updatedCart = await cart.save();

        // Populate thông tin sản phẩm trước khi trả về
        await updatedCart.populate('cartItems.product');

        res.status(200).json({
            success: true,
            data: updatedCart
        });
    } catch (error) {
        console.error('Error updating cart item:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể cập nhật sản phẩm trong giỏ hàng',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Xóa sản phẩm khỏi giỏ hàng
// @route   DELETE /api/cart/:productId
// @access  Private
export const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user._id;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin sản phẩm'
            });
        }

        // Tìm giỏ hàng
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giỏ hàng'
            });
        }

        // Lọc bỏ sản phẩm
        const initialLength = cart.cartItems.length;
        cart.cartItems = cart.cartItems.filter(
            item => item.product.toString() !== productId
        );

        // Kiểm tra xem sản phẩm có được xóa không
        if (cart.cartItems.length === initialLength) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm trong giỏ hàng'
            });
        }

        // Tính lại tổng tiền
        cart.totalAmount = cart.cartItems.reduce(
            (total, item) => total + item.price * item.quantity, 0
        );

        // Lưu giỏ hàng đã cập nhật
        const updatedCart = await cart.save();

        // Populate thông tin sản phẩm trước khi trả về
        await updatedCart.populate('cartItems.product');

        res.status(200).json({
            success: true,
            data: updatedCart
        });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể xóa sản phẩm khỏi giỏ hàng',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Xóa tất cả sản phẩm khỏi giỏ hàng
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req, res) => {
    try {
        const userId = req.user._id;

        // Tìm giỏ hàng
        const cart = await Cart.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy giỏ hàng'
            });
        }

        // Xóa tất cả sản phẩm
        cart.cartItems = [];
        cart.totalAmount = 0;

        await cart.save();

        res.status(200).json({
            success: true,
            message: 'Đã xóa tất cả sản phẩm khỏi giỏ hàng',
            data: cart
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể xóa giỏ hàng'
        });
    }
}; 