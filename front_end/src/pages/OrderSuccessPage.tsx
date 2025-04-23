import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { orderAPI } from '../services/orders';

const OrderSuccessPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [orderDetails, setOrderDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                setLoading(true);
                const response = await orderAPI.getOrderById(id || '');

                if (response.data.success) {
                    setOrderDetails(response.data.data);
                } else {
                    setError(response.data.message || 'Không thể tải thông tin đơn hàng.');
                }
            } catch (error) {
                console.error('Lỗi khi tải thông tin đơn hàng:', error);
                setError('Đã xảy ra lỗi khi tải thông tin đơn hàng. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchOrderDetails();
        } else {
            setError('Không tìm thấy mã đơn hàng.');
            setLoading(false);
        }
    }, [id]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải thông tin đơn hàng...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
                    <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h2 className="mt-4 text-xl font-semibold text-gray-800">Đã xảy ra lỗi</h2>
                    <p className="mt-2 text-gray-600">{error}</p>
                    <Link to="/" className="mt-6 inline-block bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                        Quay về trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="p-8 text-center">
                        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Đặt hàng thành công!</h1>
                        <p className="text-gray-600 mb-6">
                            Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.
                        </p>

                        <div className="border-t border-b border-gray-200 py-6 mb-6">
                            <p className="text-gray-700 mb-2">
                                <span className="font-semibold">Mã đơn hàng:</span>{' '}
                                <span className="text-blue-600">{orderDetails?._id}</span>
                            </p>
                            <p className="text-gray-700 mb-2">
                                <span className="font-semibold">Ngày đặt hàng:</span>{' '}
                                {orderDetails?.createdAt ? formatDate(orderDetails.createdAt) : 'N/A'}
                            </p>
                            <p className="text-gray-700 mb-2">
                                <span className="font-semibold">Phương thức thanh toán:</span>{' '}
                                {orderDetails?.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' :
                                    orderDetails?.paymentMethod === 'banking' ? 'Chuyển khoản ngân hàng' :
                                        orderDetails?.paymentMethod === 'momo' ? 'Ví MoMo' : orderDetails?.paymentMethod}
                            </p>
                            <p className="text-gray-700">
                                <span className="font-semibold">Tổng tiền:</span>{' '}
                                <span className="text-red-600 font-bold">{orderDetails?.totalPrice ? formatPrice(orderDetails.totalPrice) : 'N/A'}</span>
                            </p>
                        </div>

                        <div className="text-left mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Thông tin giao hàng</h3>
                            <p className="text-gray-700 mb-1">
                                <span className="font-medium">Người nhận:</span>{' '}
                                {orderDetails?.shippingAddress?.fullName}
                            </p>
                            <p className="text-gray-700 mb-1">
                                <span className="font-medium">Địa chỉ:</span>{' '}
                                {orderDetails?.shippingAddress?.address}, {orderDetails?.shippingAddress?.ward}, {orderDetails?.shippingAddress?.district}, {orderDetails?.shippingAddress?.city}
                            </p>
                            <p className="text-gray-700 mb-1">
                                <span className="font-medium">Điện thoại:</span>{' '}
                                {orderDetails?.shippingAddress?.phone}
                            </p>
                            <p className="text-gray-700">
                                <span className="font-medium">Email:</span>{' '}
                                {orderDetails?.shippingAddress?.email}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Link to="/" className="text-blue-600 bg-blue-50 hover:bg-blue-100 py-3 px-6 rounded-lg transition-colors flex items-center justify-center font-medium">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                                </svg>
                                Quay về trang chủ
                            </Link>
                            <Link to="/profile/orders" className="text-white bg-blue-600 hover:bg-blue-700 py-3 px-6 rounded-lg transition-colors flex items-center justify-center font-medium">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                                </svg>
                                Xem đơn hàng
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessPage; 