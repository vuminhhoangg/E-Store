import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { orderAPI } from '../services/orders';
import { cartAPI } from '../services/cartService';

import { User } from '../utils/auth';

interface CartItem {
    _id: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    warrantyPeriodMonths: number;
    product: {
        _id: string;
        name: string;
        warrantyPeriodMonths: number;
    };
}

interface ShippingInfo {
    fullName: string;
    address: string;
    city: string;
    district: string;
    ward: string;
    phone: string;
    notes?: string;
}

const OrderSummaryPage = () => {
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [orderTotal, setOrderTotal] = useState(0);
    const [shippingFee, setShippingFee] = useState(30000); // Mặc định phí ship 30k
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [userData, setUserData] = useState<User | null>(null);
    const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
    const [confirmLoading, setConfirmLoading] = useState(false);

    useEffect(() => {
        // Kiểm tra thông tin giao hàng
        const savedShippingInfo = localStorage.getItem('shippingInfo');
        if (!savedShippingInfo) {
            toast.error('Vui lòng nhập thông tin giao hàng');
            navigate('/checkout');
            return;
        }
        setShippingInfo(JSON.parse(savedShippingInfo));

        // Kiểm tra thông tin phương thức thanh toán
        const savedPaymentMethod = localStorage.getItem('paymentMethod');
        if (savedPaymentMethod) {
            setPaymentMethod(savedPaymentMethod);
        } else {
            // Mặc định là COD nếu không có
            setPaymentMethod('cod');
        }

        // Lấy thông tin người dùng
        try {
            const userInfoStr = localStorage.getItem('user_info');
            if (userInfoStr) {
                const userData = JSON.parse(userInfoStr) as User;
                setUserData(userData);
            } else {
                toast.error('Vui lòng đăng nhập để tiếp tục');
                navigate('/login?redirect=order-summary');
                return;
            }
        } catch (error) {
            console.error('Lỗi khi lấy thông tin người dùng:', error);
            toast.error('Có lỗi xảy ra, vui lòng đăng nhập lại');
            navigate('/login?redirect=order-summary');
            return;
        }

        // Lấy giỏ hàng từ local storage
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            try {
                const parsedCart = JSON.parse(storedCart);
                if (parsedCart.length === 0) {
                    toast.info('Giỏ hàng của bạn đang trống');
                    navigate('/cart');
                    return;
                }
                setCartItems(parsedCart);

                // Tính tổng tiền
                const total = parsedCart.reduce(
                    (sum: number, item: CartItem) => sum + item.price * item.quantity,
                    0
                );
                setOrderTotal(total);

                // Tính phí vận chuyển
                if (total >= 5000000) {
                    setShippingFee(0); // Miễn phí vận chuyển cho đơn hàng từ 5 triệu trở lên
                } else {
                    setShippingFee(30000); // 30.000đ phí vận chuyển cho đơn hàng dưới 5 triệu
                }
            } catch (error) {
                console.error('Lỗi khi xử lý giỏ hàng:', error);
                toast.error('Đã xảy ra lỗi khi tải giỏ hàng');
                navigate('/cart');
            }
        } else {
            toast.info('Giỏ hàng của bạn đang trống');
            navigate('/cart');
        }
    }, [navigate]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getPaymentMethodName = (method: string) => {
        switch (method) {
            case 'cod':
                return 'Thanh toán khi nhận hàng (COD)';
            case 'banking':
                return 'Chuyển khoản ngân hàng';
            case 'momo':
                return 'Ví điện tử MoMo';
            default:
                return 'Không xác định';
        }
    };

    const handleConfirmOrder = async () => {
        if (!userData || !userData._id || !shippingInfo) {
            toast.error('Thiếu thông tin cần thiết để đặt hàng');
            return;
        }

        try {
            setConfirmLoading(true);

            // Tạo dữ liệu đơn hàng để gửi API
            const orderData = {
                userId: userData._id,
                items: cartItems.map(item => ({
                    productId: item.product._id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    warrantyPeriodMonths: item.warrantyPeriodMonths,
                })),
                shippingAddress: shippingInfo,
                paymentMethod: paymentMethod,
                itemsPrice: orderTotal,
                shippingPrice: shippingFee,
                totalPrice: orderTotal + shippingFee,
                notes: shippingInfo.notes || '',
                isPaid: false,
                paidAt: null,
            };

            // Gọi API tạo đơn hàng
            console.log('Đang gửi dữ liệu đặt hàng:', orderData);
            const response = await orderAPI.createOrder(orderData);
            console.log('Phản hồi từ API tạo đơn hàng:', response);

            // Xóa giỏ hàng trên server
            try {
                await cartAPI.clearCart();
                console.log('Đã xóa giỏ hàng trên server');
            } catch (cartError) {
                console.error('Không thể xóa giỏ hàng trên server:', cartError);
                // Tiếp tục xử lý ngay cả khi không thể xóa giỏ hàng trên server
            }

            // Xóa thông tin giỏ hàng và thông tin thanh toán sau khi đặt hàng thành công
            localStorage.removeItem('cart');
            localStorage.removeItem('paymentMethod');
            localStorage.removeItem('shippingInfo');

            // Thông báo cho các component khác rằng giỏ hàng đã thay đổi
            window.dispatchEvent(new Event('cartUpdated'));

            // Hiển thị thông báo và chuyển đến trang thành công
            toast.success('Đặt hàng thành công!');

            // Kiểm tra cấu trúc response và điều hướng tương ứng
            console.log('Kiểm tra phản hồi API:',
                'response =', Boolean(response),
                'response.data =', Boolean(response?.data),
                'response.data.data =', Boolean(response?.data?.data),
                'order ID =', response?.data?.data?._id || response?.data?._id);

            // Lấy ID đơn hàng từ phản hồi
            let orderId = null;
            if (response && response.data) {
                if (response.data.data && response.data.data._id) {
                    orderId = response.data.data._id;
                } else if (response.data._id) {
                    orderId = response.data._id;
                }
            }

            if (orderId) {
                // Nếu có ID đơn hàng, chuyển đến trang Order Success với ID
                console.log('Chuyển hướng đến /order-success/' + orderId);
                navigate(`/order-success/${orderId}`);
            } else {
                // Nếu không có ID, vẫn chuyển đến trang Order Success không có ID
                console.log('Không tìm thấy ID đơn hàng, chuyển hướng đến /order-success');
                navigate('/order-success');
            }
        } catch (error) {
            console.error('Lỗi khi đặt hàng:', error);
            toast.error('Đã xảy ra lỗi khi đặt hàng. Vui lòng thử lại sau.');
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/checkout');
    };

    // Hiển thị trang loading nếu đang tải dữ liệu
    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="text-center text-gray-600 mt-4">Đang tải...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Xác nhận đơn hàng</h1>
                        <p className="text-gray-600">Vui lòng kiểm tra thông tin đơn hàng trước khi xác nhận</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                                </svg>
                                Thông tin sản phẩm
                            </h2>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Sản phẩm
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Đơn giá
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Số lượng
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Thành tiền
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {cartItems.map((item) => (
                                            <tr key={item._id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden mr-4">
                                                            <img
                                                                src={item.image}
                                                                alt={item.name}
                                                                className="h-full w-full object-contain"
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.src = 'https://via.placeholder.com/150';
                                                                }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                            <div className="text-xs text-gray-500">Bảo hành: {item.warrantyPeriodMonths} tháng</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{formatPrice(item.price)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{item.quantity}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-blue-600">{formatPrice(item.price * item.quantity)}</div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Thông tin giao hàng</h3>
                                {shippingInfo && (
                                    <div className="space-y-2">
                                        <p className="flex justify-between">
                                            <span className="text-gray-600">Người nhận:</span>
                                            <span className="font-medium">{shippingInfo.fullName}</span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span className="text-gray-600">Số điện thoại:</span>
                                            <span className="font-medium">{shippingInfo.phone}</span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span className="text-gray-600">Địa chỉ:</span>
                                            <span className="font-medium text-right">{shippingInfo.address}</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-medium text-gray-800 border-b pb-2">Thông tin thanh toán</h3>
                                <div className="space-y-2">
                                    <p className="flex justify-between">
                                        <span className="text-gray-600">Phương thức:</span>
                                        <span className="font-medium">{getPaymentMethodName(paymentMethod)}</span>
                                    </p>
                                    {paymentMethod === 'cod' && (
                                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 my-2 text-sm text-yellow-800">
                                            <p className="font-medium mb-1">Lưu ý khi thanh toán COD:</p>
                                            <ul className="list-disc list-inside text-xs space-y-1">
                                                <li>Kiểm tra hàng trước khi thanh toán</li>
                                                <li>Thanh toán bằng tiền mặt cho người giao hàng</li>
                                                <li>Giữ biên lai thanh toán để đối chiếu nếu cần</li>
                                            </ul>
                                        </div>
                                    )}
                                    <p className="flex justify-between">
                                        <span className="text-gray-600">Tạm tính:</span>
                                        <span className="font-medium">{formatPrice(orderTotal)}</span>
                                    </p>
                                    <p className="flex justify-between">
                                        <span className="text-gray-600">Phí vận chuyển:</span>
                                        <span className="font-medium">
                                            {shippingFee === 0
                                                ? <span className="text-green-600">Miễn phí</span>
                                                : formatPrice(shippingFee)
                                            }
                                        </span>
                                    </p>
                                    <p className="flex justify-between text-lg font-medium border-t pt-2 mt-2">
                                        <span className="text-gray-800">Tổng cộng:</span>
                                        <span className="text-blue-600">{formatPrice(orderTotal + shippingFee)}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 flex flex-col sm:flex-row gap-4 justify-end">
                            <button
                                onClick={handleBack}
                                className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                            >
                                Quay lại chỉnh sửa
                            </button>
                            <button
                                onClick={handleConfirmOrder}
                                disabled={confirmLoading}
                                className={`px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:from-blue-700 hover:to-blue-800 transition-colors shadow-md flex items-center justify-center ${confirmLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {confirmLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Xác nhận đặt hàng'
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="text-center text-sm text-gray-500 mt-6">
                        <p>Với việc xác nhận đặt hàng, bạn đồng ý với các điều khoản sử dụng và chính sách bảo mật của chúng tôi.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSummaryPage;
