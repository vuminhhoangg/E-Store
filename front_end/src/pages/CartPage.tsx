import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const CartPage = () => {
    const [cartItems, setCartItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [couponCode, setCouponCode] = useState('')
    const [couponApplied, setCouponApplied] = useState(false)
    const [discount, setDiscount] = useState(0)

    useEffect(() => {
        // Mô phỏng lấy dữ liệu từ API
        const fetchCartItems = async () => {
            try {
                // Thay thế bằng API call thực tế trong dự án thực
                setTimeout(() => {
                    const mockCartItems = [
                        {
                            id: 1,
                            productId: 1,
                            name: 'iPhone 14 Pro Max',
                            price: 28990000,
                            image: 'https://images.unsplash.com/photo-1664478546384-d57e49c96b8e?auto=format&fit=crop&q=80&w=400',
                            quantity: 1,
                            available: true,
                            stockCount: 10,
                        },
                        {
                            id: 2,
                            productId: 3,
                            name: 'MacBook Pro M2',
                            price: 35990000,
                            image: 'https://images.unsplash.com/photo-1569770218135-bea267ed7e84?auto=format&fit=crop&q=80&w=400',
                            quantity: 1,
                            available: true,
                            stockCount: 5,
                        },
                        {
                            id: 3,
                            productId: 7,
                            name: 'AirPods Pro',
                            price: 5990000,
                            image: 'https://images.unsplash.com/photo-1603351154351-5e2d0600ff5a?auto=format&fit=crop&q=80&w=400',
                            quantity: 2,
                            available: true,
                            stockCount: 15,
                        },
                    ]
                    setCartItems(mockCartItems)
                    setLoading(false)
                }, 1000)
            } catch (error) {
                console.error('Error fetching cart items:', error)
                setLoading(false)
            }
        }

        fetchCartItems()
    }, [])

    const handleQuantityChange = (id: number, newQuantity: number) => {
        if (newQuantity < 1) return

        const item = cartItems.find(item => item.id === id)
        if (item && newQuantity > item.stockCount) return

        setCartItems(cartItems.map(item =>
            item.id === id ? { ...item, quantity: newQuantity } : item
        ))
    }

    const handleRemoveItem = (id: number) => {
        setCartItems(cartItems.filter(item => item.id !== id))
    }

    const handleApplyCoupon = () => {
        if (couponCode.trim() === '') return

        // Mô phỏng kiểm tra mã giảm giá
        if (couponCode.toUpperCase() === 'SAVE10') {
            setCouponApplied(true)
            setDiscount(0.1) // Giảm 10%
        } else if (couponCode.toUpperCase() === 'SAVE20') {
            setCouponApplied(true)
            setDiscount(0.2) // Giảm 20%
        } else {
            alert('Mã giảm giá không hợp lệ!')
            setCouponApplied(false)
            setDiscount(0)
        }
    }

    const calculateSubtotal = () => {
        return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
    }

    const calculateDiscountAmount = () => {
        return calculateSubtotal() * discount
    }

    const calculateTotal = () => {
        return calculateSubtotal() - calculateDiscountAmount()
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between mb-8 items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Giỏ hàng của bạn</h1>
                    <p className="text-gray-600 mt-1">
                        {cartItems.length > 0
                            ? `Bạn có ${cartItems.length} sản phẩm trong giỏ hàng`
                            : 'Giỏ hàng của bạn đang trống'}
                    </p>
                </div>

                <Link to="/products" className="inline-flex items-center text-blue-600 hover:text-blue-800 mt-4 md:mt-0">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                    </svg>
                    Tiếp tục mua sắm
                </Link>
            </div>

            {loading ? (
                <div className="animate-pulse">
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="h-6 bg-gray-300 rounded w-1/4 mb-8"></div>
                        {[1, 2].map((_, index) => (
                            <div key={index} className="flex flex-col md:flex-row border-b py-6">
                                <div className="bg-gray-300 w-full md:w-24 h-24 rounded mb-4 md:mb-0"></div>
                                <div className="flex-grow md:ml-6">
                                    <div className="h-5 bg-gray-300 rounded w-3/4 mb-3"></div>
                                    <div className="h-4 bg-gray-300 rounded w-1/2 mb-6"></div>
                                    <div className="flex justify-between">
                                        <div className="h-8 bg-gray-300 rounded w-24"></div>
                                        <div className="h-8 bg-gray-300 rounded w-24"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6 w-full md:w-1/3 ml-auto">
                        <div className="h-6 bg-gray-300 rounded w-1/3 mb-8"></div>
                        <div className="h-4 bg-gray-300 rounded w-full mb-3"></div>
                        <div className="h-4 bg-gray-300 rounded w-full mb-3"></div>
                        <div className="h-4 bg-gray-300 rounded w-full mb-8"></div>
                        <div className="h-10 bg-gray-300 rounded w-full"></div>
                    </div>
                </div>
            ) : (
                <>
                    {cartItems.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-md p-8 text-center">
                            <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                            <h2 className="text-2xl font-semibold text-gray-700 mt-4">Giỏ hàng của bạn đang trống</h2>
                            <p className="text-gray-500 mt-2 mb-6">Hãy khám phá các sản phẩm và thêm vào giỏ hàng</p>
                            <Link to="/products" className="btn-primary py-3 px-6">
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

                                        {cartItems.map((item) => (
                                            <div key={item.id} className="flex flex-col md:flex-row py-6 border-b">
                                                {/* Product Info */}
                                                <div className="flex md:w-1/2 mb-4 md:mb-0">
                                                    <div className="w-24 h-24 flex-shrink-0">
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="w-full h-full object-cover rounded-md"
                                                        />
                                                    </div>
                                                    <div className="ml-4 flex flex-col">
                                                        <Link to={`/product/${item.productId}`} className="text-lg font-medium text-gray-800 hover:text-blue-600">
                                                            {item.name}
                                                        </Link>

                                                        <div className="mt-1 flex items-center text-sm">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                                {item.available ? 'Còn hàng' : 'Hết hàng'}
                                                            </span>
                                                        </div>

                                                        <button
                                                            onClick={() => handleRemoveItem(item.id)}
                                                            className="inline-flex items-center text-sm text-red-500 hover:text-red-700 mt-4 md:mt-auto"
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
                                                    <div className="flex items-center border rounded-md">
                                                        <button
                                                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 focus:outline-none text-gray-600 rounded-l-md"
                                                        >
                                                            -
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max={item.stockCount}
                                                            value={item.quantity}
                                                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                                                            className="w-12 text-center border-x py-1 focus:outline-none"
                                                        />
                                                        <button
                                                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 focus:outline-none text-gray-600 rounded-r-md"
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
                                        ))}
                                    </div>
                                </div>

                                {/* Coupon */}
                                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Mã giảm giá</h2>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            placeholder="Nhập mã giảm giá"
                                            className="w-full rounded-l-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <button
                                            onClick={handleApplyCoupon}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-r-md transition duration-200"
                                        >
                                            Áp dụng
                                        </button>
                                    </div>
                                    {couponApplied && (
                                        <div className="mt-3 text-green-600 flex items-center">
                                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                            <span>Mã giảm giá đã được áp dụng!</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="lg:w-1/3">
                                <div className="bg-white rounded-lg shadow-md p-6 sticky top-[100px]">
                                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Tóm tắt đơn hàng</h2>

                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Tạm tính ({cartItems.reduce((total, item) => total + item.quantity, 0)} sản phẩm)</span>
                                            <span className="font-medium">{formatPrice(calculateSubtotal())}</span>
                                        </div>

                                        {couponApplied && (
                                            <div className="flex justify-between text-red-600">
                                                <span>Giảm giá ({discount * 100}%)</span>
                                                <span>-{formatPrice(calculateDiscountAmount())}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Phí vận chuyển</span>
                                            <span className="font-medium">Miễn phí</span>
                                        </div>

                                        <div className="border-t pt-4 mt-4">
                                            <div className="flex justify-between">
                                                <span className="font-semibold text-gray-800">Tổng cộng</span>
                                                <span className="font-bold text-2xl text-blue-600">{formatPrice(calculateTotal())}</span>
                                            </div>
                                            <p className="text-gray-500 text-sm mt-1">(Đã bao gồm VAT)</p>
                                        </div>
                                    </div>

                                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium mt-6 transition duration-200">
                                        Tiến hành thanh toán
                                    </button>

                                    <div className="mt-6 flex items-center justify-center space-x-6">
                                        <div className="flex items-center">
                                            <svg className="w-8 h-8 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                            </svg>
                                            <span className="text-gray-600 text-sm">Thanh toán an toàn</span>
                                        </div>
                                        <div className="flex items-center">
                                            <svg className="w-8 h-8 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                            </svg>
                                            <span className="text-gray-600 text-sm">30 ngày đổi trả</span>
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