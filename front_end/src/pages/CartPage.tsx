import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../components/AuthContext';
import { cartAPI, Cart } from '../services/cartService';
import { toast } from 'react-toastify';

interface ProductDetail {
    _id: string;
    name: string;
    image: string;
    price: number;
    description: string;
    rating: number;
    numReviews: number;
    countInStock: number;
    category: string;
}

interface CartItem {
    product: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
}

const CartPage = () => {
    const [cart, setCart] = useState<Cart | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);
    const [discount, setDiscount] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const { isAuthenticated, refreshSession } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/cart' } });
            return;
        }

        fetchCartItems();
    }, [isAuthenticated, navigate, retryCount]);

    const fetchCartItems = async () => {
        try {
            setLoading(true);
            setError(null);

            // Refresh session trước khi lấy giỏ hàng để đảm bảo token vẫn hợp lệ
            if (refreshSession) {
                await refreshSession();
            }

            const response = await cartAPI.getCart();
            console.log('Cart response:', response);

            if (response && response.success) {
                // Cập nhật state với dữ liệu mới từ server
                setCart(response.data);
            } else {
                console.error('Failed to fetch cart:', response);
                setError('Không thể lấy thông tin giỏ hàng');
                toast.error('Không thể lấy thông tin giỏ hàng');
            }
        } catch (error) {
            console.error('Error fetching cart items:', error);
            setError('Lỗi khi tải giỏ hàng. Vui lòng thử lại sau');
            toast.error('Lỗi khi tải giỏ hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleRetry = () => {
        setRetryCount(prev => prev + 1);
    };

    const handleQuantityChange = async (productId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        try {
            setLoading(true);

            // Gửi request đến server trước để cập nhật số lượng
            const response = await cartAPI.updateCartItem(productId, newQuantity);
            console.log('Update cart response:', response);

            if (response && response.success) {
                // Cập nhật state với dữ liệu mới từ server
                setCart(response.data);
                toast.success('Đã cập nhật số lượng sản phẩm');
            } else {
                toast.error('Không thể cập nhật số lượng sản phẩm');
                // Nếu cập nhật thất bại, fetch lại cart để đảm bảo UI khớp với dữ liệu server
                await fetchCartItems();
            }
        } catch (error) {
            console.error('Error updating cart item:', error);
            toast.error('Lỗi khi cập nhật số lượng');
            // Nếu có lỗi, fetch lại cart để đảm bảo UI khớp với dữ liệu server
            await fetchCartItems();
        } finally {
            setLoading(false);
        }
    }

    const handleRemoveItem = async (productId: string) => {
        try {
            setLoading(true);

            // Gọi API để xóa sản phẩm
            const response = await cartAPI.removeFromCart(productId);
            console.log('Remove cart item response:', response);

            if (response && response.success) {
                // Cập nhật state với dữ liệu mới từ server
                setCart(response.data);
                toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
            } else {
                toast.error('Không thể xóa sản phẩm khỏi giỏ hàng');
                // Nếu xóa thất bại, fetch lại cart để đảm bảo UI khớp với dữ liệu server
                await fetchCartItems();
            }
        } catch (error) {
            console.error('Error removing item from cart:', error);
            toast.error('Lỗi khi xóa sản phẩm');
            // Nếu có lỗi, fetch lại cart để đảm bảo UI khớp với dữ liệu server
            await fetchCartItems();
        } finally {
            setLoading(false);
        }
    }

    const handleApplyCoupon = () => {
        if (couponCode.trim() === '') {
            toast.error('Vui lòng nhập mã giảm giá');
            return;
        }

        // Mô phỏng kiểm tra mã giảm giá
        if (couponCode.toUpperCase() === 'SAVE10') {
            setCouponApplied(true);
            setDiscount(0.1); // Giảm 10%
            toast.success('Áp dụng mã giảm giá thành công: Giảm 10%');
        } else if (couponCode.toUpperCase() === 'SAVE20') {
            setCouponApplied(true);
            setDiscount(0.2); // Giảm 20%
            toast.success('Áp dụng mã giảm giá thành công: Giảm 20%');
        } else {
            toast.error('Mã giảm giá không hợp lệ!');
            setCouponApplied(false);
            setDiscount(0);
        }
    }

    const handleCheckout = () => {
        if (!cart || cart.cartItems.length === 0) {
            toast.error('Giỏ hàng trống, vui lòng thêm sản phẩm');
            return;
        }
        navigate('/checkout');
    }

    const calculateSubtotal = () => {
        return cart?.totalAmount || 0;
    }

    const calculateDiscountAmount = () => {
        return calculateSubtotal() * discount;
    }

    const calculateTotal = () => {
        return calculateSubtotal() - calculateDiscountAmount();
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    }

    const handleProductClick = (productId: string) => {
        navigate(`/product/${productId}`);
    };

    // Hiển thị màn hình lỗi với nút thử lại
    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                    <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Đã xảy ra lỗi</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={handleRetry}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition-colors"
                        >
                            Thử lại
                        </button>
                        <Link
                            to="/products"
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-6 rounded-md transition-colors"
                        >
                            Tiếp tục mua sắm
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between mb-8 items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Giỏ hàng của bạn</h1>
                    <p className="text-gray-600 mt-1">
                        {cart && cart.cartItems.length > 0
                            ? `Bạn có ${cart.cartItems.length} sản phẩm trong giỏ hàng`
                            : 'Giỏ hàng của bạn đang trống'}
                    </p>
                </div>

                <Link to="/products" className="inline-flex items-center text-blue-600 hover:text-blue-800 mt-4 md:mt-0 group">
                    <svg className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    Tiếp tục mua sắm
                </Link>
            </div>

            {loading ? (
                <div className="animate-pulse">
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="h-6 bg-gray-200 rounded w-1/4 mb-8"></div>
                        {[1, 2].map((_, index) => (
                            <div key={index} className="flex flex-col md:flex-row border-b py-6">
                                <div className="bg-gray-200 w-full md:w-24 h-24 rounded mb-4 md:mb-0"></div>
                                <div className="flex-grow md:ml-6">
                                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                                    <div className="flex justify-between">
                                        <div className="h-8 bg-gray-200 rounded w-24"></div>
                                        <div className="h-8 bg-gray-200 rounded w-24"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 w-full md:w-1/3 ml-auto">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-8"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-8"></div>
                        <div className="h-10 bg-gray-200 rounded w-full"></div>
                    </div>
                </div>
            ) : (
                <>
                    {!cart || cart.cartItems.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                            <h2 className="text-2xl font-semibold text-gray-700 mt-4">Giỏ hàng của bạn đang trống</h2>
                            <p className="text-gray-500 mt-2 mb-6">Hãy khám phá các sản phẩm và thêm vào giỏ hàng</p>
                            <Link to="/products" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 px-6 rounded-md transition-all duration-300 transform hover:scale-105 inline-flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                                </svg>
                                Mua sắm ngay
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Cart Items */}
                            <div className="lg:w-2/3">
                                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                                    <div className="p-6">
                                        <h2 className="text-xl font-semibold text-gray-800 mb-6">Sản phẩm đã chọn</h2>

                                        <div className="hidden md:flex text-sm font-medium text-gray-500 mb-4 pb-2 border-b">
                                            <div className="w-1/2">Sản phẩm</div>
                                            <div className="w-1/6 text-center">Đơn giá</div>
                                            <div className="w-1/6 text-center">Số lượng</div>
                                            <div className="w-1/6 text-center">Thành tiền</div>
                                        </div>

                                        {cart.cartItems.map((item) => {
                                            console.log('Cart item:', item); // Debug log
                                            return (
                                                <div key={item.product} className="flex flex-col md:flex-row py-6 border-b group hover:bg-gray-50 transition-colors duration-300">
                                                    {/* Product Info */}
                                                    <div className="flex md:w-1/2 mb-4 md:mb-0">
                                                        <Link
                                                            to={`/product/${item.product}`}
                                                            className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-md cursor-pointer"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                navigate(`/product/${item.product}`);
                                                            }}
                                                        >
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                                                            />
                                                        </Link>
                                                        <div className="ml-4 flex flex-col justify-between">
                                                            <Link
                                                                to={`/product/${item.product}`}
                                                                className="text-lg font-medium text-gray-800 hover:text-blue-600 transition-colors duration-300"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    navigate(`/product/${item.product}`);
                                                                }}
                                                            >
                                                                {item.name}
                                                            </Link>

                                                            <button
                                                                onClick={() => handleRemoveItem(item.product)}
                                                                className="inline-flex items-center text-sm text-red-500 hover:text-red-700 mt-4 md:mt-auto transition-colors duration-300"
                                                            >
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                                </svg>
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Price */}
                                                    <div className="md:w-1/6 text-center flex items-center justify-between md:justify-center mb-4 md:mb-0">
                                                        <span className="md:hidden text-gray-600">Đơn giá:</span>
                                                        <span className="font-medium">{formatPrice(item.price)}</span>
                                                    </div>

                                                    {/* Quantity */}
                                                    <div className="md:w-1/6 flex items-center justify-between md:justify-center mb-4 md:mb-0">
                                                        <span className="md:hidden text-gray-600">Số lượng:</span>
                                                        <div className="flex items-center border rounded-md overflow-hidden">
                                                            <button
                                                                onClick={() => handleQuantityChange(item.product, item.quantity - 1)}
                                                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 focus:outline-none text-gray-600 transition-colors duration-300"
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => handleQuantityChange(item.product, parseInt(e.target.value) || 1)}
                                                                className="w-12 text-center border-x py-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                            />
                                                            <button
                                                                onClick={() => handleQuantityChange(item.product, item.quantity + 1)}
                                                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 focus:outline-none text-gray-600 transition-colors duration-300"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Total */}
                                                    <div className="md:w-1/6 text-center flex items-center justify-between md:justify-center">
                                                        <span className="md:hidden text-gray-600">Thành tiền:</span>
                                                        <span className="font-semibold text-blue-600">{formatPrice(item.price * item.quantity)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="lg:w-1/3">
                                <div className="bg-white rounded-lg shadow-lg p-6 sticky top-32">
                                    <div className="flex items-center justify-between mb-6 pb-4 border-b">
                                        <h2 className="text-xl font-semibold text-gray-800">Hóa đơn thanh toán</h2>
                                        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                            {cart.cartItems.length} sản phẩm
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between py-3 border-b">
                                            <span className="text-base text-gray-600">Tạm tính</span>
                                            <span className="text-base font-medium">{formatPrice(calculateSubtotal())}</span>
                                        </div>

                                        {couponApplied && (
                                            <div className="flex justify-between py-3 border-b">
                                                <div className="flex items-center">
                                                    <span className="text-base text-green-600">Giảm giá</span>
                                                    <span className="ml-2 text-sm bg-green-100 text-green-600 px-3 py-1 rounded-full">
                                                        {discount * 100}%
                                                    </span>
                                                </div>
                                                <span className="text-base font-medium text-green-600">-{formatPrice(calculateDiscountAmount())}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between py-3 border-b">
                                            <span className="text-base text-gray-600">Phí vận chuyển</span>
                                            <span className="text-base font-medium text-green-600">Miễn phí</span>
                                        </div>

                                        <div className="flex justify-between py-4 border-b">
                                            <span className="text-lg font-semibold">Tổng cộng</span>
                                            <div className="text-right">
                                                <span className="text-xl font-bold text-blue-600">{formatPrice(calculateTotal())}</span>
                                                <p className="text-sm text-gray-500 mt-1">Đã bao gồm VAT (nếu có)</p>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <div className="flex">
                                                <input
                                                    type="text"
                                                    placeholder="Nhập mã giảm giá"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value)}
                                                    className="flex-grow px-4 py-2 text-base border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors duration-300"
                                                />
                                                <button
                                                    onClick={handleApplyCoupon}
                                                    className="px-4 py-2 text-base bg-gray-100 border border-l-0 rounded-r-md hover:bg-gray-200 focus:outline-none transition-colors duration-300"
                                                >
                                                    Áp dụng
                                                </button>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleCheckout}
                                            className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 px-6 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                                            </svg>
                                            Tiến hành thanh toán
                                        </button>

                                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center text-sm text-gray-600 mb-3">
                                                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                                Miễn phí vận chuyển cho đơn hàng từ 500.000đ
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600">
                                                <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                                Đổi trả trong vòng 7 ngày
                                            </div>
                                        </div>

                                        <div className="mt-6 text-center">
                                            <p className="text-sm text-gray-500 mb-3">
                                                Chúng tôi chấp nhận thanh toán bằng:
                                            </p>
                                            <div className="flex justify-center space-x-4">
                                                <img src="https://logos-world.net/wp-content/uploads/2020/04/Visa-Logo-2014-present.jpg" alt="Visa" className="h-6" />
                                                <img src="https://www.pngarts.com/files/3/Mastercard-Logo-PNG-Image-Background.png" alt="Mastercard" className="h-6" />
                                                <img src="https://st4.depositphotos.com/11576988/40966/v/450/depositphotos_409668866-stock-illustration-dollar-bill-icon-stack-cash.jpg" alt="COD" className="h-7" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default CartPage 