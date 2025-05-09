import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../services/orders';
import { toast } from 'react-toastify';
import { useAuth } from '../components/AuthContext';

// Định nghĩa CSS animations
const animationStyles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}

.animate-scaleIn {
  animation: scaleIn 0.3s ease-out forwards;
}
`;

// Định nghĩa interface cho cấu trúc dữ liệu đơn hàng
interface OrderItem {
    productId: string;
    name: string;
    image?: string;
    price: number;
    quantity: number;
    warrantyPeriodMonths?: number;
}

interface ShippingAddress {
    fullName: string;
    address: string;
    city: string;
    district: string;
    ward: string;
    phone: string;
    notes?: string;
}

interface Order {
    _id: string;
    items: OrderItem[];
    totalAmount: number;
    totalPrice: number;
    shippingPrice?: number;
    itemsPrice?: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
    shippingAddress?: ShippingAddress;
    deliveredAt?: string;
    isPaid: boolean;
    paidAt?: string;
}

const UserOrders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { isLoggedIn, user } = useAuth();

    useEffect(() => {
        if (isLoggedIn) {
            fetchUserOrders();
        } else {
            setError('Vui lòng đăng nhập để xem đơn hàng của bạn');
            setLoading(false);
        }
    }, [isLoggedIn]);

    const fetchUserOrders = async () => {
        try {
            setLoading(true);
            const response = await orderAPI.getUserOrders();
            console.log('Dữ liệu đơn hàng:', response);

            if (response.success && Array.isArray(response.data)) {
                // Sắp xếp đơn hàng theo thời gian giảm dần (mới nhất lên đầu)
                const sortedOrders = response.data.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                setOrders(sortedOrders);
            } else {
                setOrders([]);
                setError('Không thể tải danh sách đơn hàng');
            }
        } catch (error) {
            console.error('Lỗi khi tải đơn hàng:', error);
            toast.error('Đã xảy ra lỗi khi tải danh sách đơn hàng');
            setError('Đã xảy ra lỗi khi tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
    };

    const getStatusName = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Chờ xác nhận';
            case 'processing':
                return 'Đang xử lý';
            case 'shipping':
                return 'Đang giao hàng';
            case 'delivered':
                return 'Đã giao hàng';
            case 'cancelled':
                return 'Đã hủy';
            default:
                return 'Không xác định';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'yellow';
            case 'processing':
                return 'blue';
            case 'shipping':
                return 'indigo';
            case 'delivered':
                return 'green';
            case 'cancelled':
                return 'red';
            default:
                return 'gray';
        }
    };

    const getPaymentMethodName = (method: string) => {
        switch (method) {
            case 'cod':
                return 'Thanh toán khi nhận hàng';
            case 'banking':
                return 'Chuyển khoản ngân hàng';
            case 'momo':
                return 'Ví MoMo';
            case 'zalopay':
                return 'ZaloPay';
            case 'paypal':
                return 'PayPal';
            default:
                return method;
        }
    }

    const viewOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setDetailsModalOpen(true);
    };

    const closeModal = () => {
        setDetailsModalOpen(false);
    };

    const getFormattedAddress = (address?: ShippingAddress) => {
        if (!address) return 'Không có thông tin';

        // Tạo mảng các thành phần địa chỉ
        const addressParts = [];

        // Chỉ thêm các phần có giá trị
        if (address.address && address.address.trim()) {
            addressParts.push(address.address.trim());
        }

        if (address.ward && address.ward.trim()) {
            addressParts.push(address.ward.trim());
        }

        if (address.district && address.district.trim()) {
            addressParts.push(address.district.trim());
        }

        if (address.city && address.city.trim()) {
            addressParts.push(address.city.trim());
        }

        // Nếu không có phần nào, trả về thông báo
        if (addressParts.length === 0) {
            return 'Không có thông tin địa chỉ';
        }

        // Nối các phần địa chỉ bằng dấu phẩy và khoảng trắng
        return addressParts.join(', ');
    };

    // Nội dung cho trạng thái loading
    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-8 relative">
                    <span className="inline-block pb-2 border-b-4 border-blue-500">Đơn hàng của tôi</span>
                </h1>
                <div className="bg-white rounded-xl shadow-lg p-10 text-center">
                    <div className="flex flex-col items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                        <p className="mt-6 text-lg text-gray-600">Đang tải danh sách đơn hàng...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Nội dung khi có lỗi
    if (error) {
        return (
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-8 relative">
                    <span className="inline-block pb-2 border-b-4 border-blue-500">Đơn hàng của tôi</span>
                </h1>
                <div className="bg-white rounded-xl shadow-lg p-10 text-center">
                    <div className="text-red-500 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Đã xảy ra lỗi</h2>
                    <p className="text-gray-600 mb-8 text-lg">{error}</p>
                    <button
                        onClick={fetchUserOrders}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 relative">
                <span className="inline-block pb-2 border-b-4 border-blue-500">Đơn hàng của tôi</span>
            </h1>

            {orders.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                    <div className="text-gray-400 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Bạn chưa có đơn hàng nào</h2>
                    <p className="text-gray-500 mb-8 text-lg max-w-md mx-auto">Hãy mua sắm và quay lại đây để theo dõi đơn hàng của bạn</p>
                    <Link to="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 inline-block">
                        Mua sắm ngay
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gradient-to-r from-blue-50 to-white">
                                        Mã đơn hàng
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gradient-to-r from-blue-50 to-white">
                                        Ngày đặt
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gradient-to-r from-blue-50 to-white">
                                        Tổng tiền
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gradient-to-r from-blue-50 to-white">
                                        Trạng thái
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gradient-to-r from-blue-50 to-white">
                                        Thanh toán
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gradient-to-r from-blue-50 to-white">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.map((order) => {
                                    const statusColor = getStatusColor(order.status);
                                    let badgeClass = '';

                                    switch (statusColor) {
                                        case 'yellow':
                                            badgeClass = 'bg-yellow-100 text-yellow-800 border border-yellow-200';
                                            break;
                                        case 'blue':
                                            badgeClass = 'bg-blue-100 text-blue-800 border border-blue-200';
                                            break;
                                        case 'indigo':
                                            badgeClass = 'bg-indigo-100 text-indigo-800 border border-indigo-200';
                                            break;
                                        case 'green':
                                            badgeClass = 'bg-green-100 text-green-800 border border-green-200';
                                            break;
                                        case 'red':
                                            badgeClass = 'bg-red-100 text-red-800 border border-red-200';
                                            break;
                                        default:
                                            badgeClass = 'bg-gray-100 text-gray-800 border border-gray-200';
                                    }

                                    return (
                                        <tr key={order._id} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                                <span className="hover:underline cursor-pointer" onClick={() => viewOrderDetails(order)}>
                                                    {order._id.substring(0, 10)}...
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(order.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {formatPrice(order.totalAmount || order.totalPrice)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                                                    {getStatusName(order.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {getPaymentMethodName(order.paymentMethod)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => viewOrderDetails(order)}
                                                    className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors font-medium"
                                                >
                                                    Chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal chi tiết đơn hàng */}
            {detailsModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
                        <div className="relative">
                            <div className="absolute top-0 w-full h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-xl"></div>
                            <div className="p-8 pt-20">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng</h2>
                                    <button
                                        onClick={closeModal}
                                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors focus:outline-none"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    {/* Thông tin đơn hàng */}
                                    <div className="bg-gray-50 p-6 rounded-xl shadow-inner">
                                        <h3 className="text-xl font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Thông tin đơn hàng
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <p className="text-sm"><span className="font-medium text-gray-600 inline-block w-32">Mã đơn hàng:</span> <span className="text-blue-600 font-medium">{selectedOrder._id}</span></p>
                                                <p className="text-sm"><span className="font-medium text-gray-600 inline-block w-32">Ngày đặt hàng:</span> {formatDate(selectedOrder.createdAt)}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-sm flex items-center">
                                                    <span className="font-medium text-gray-600 inline-block w-32">Trạng thái:</span>
                                                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                                        getStatusColor(selectedOrder.status) === 'blue' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                                            getStatusColor(selectedOrder.status) === 'green' ? 'bg-green-100 text-green-800 border border-green-200' :
                                                                getStatusColor(selectedOrder.status) === 'red' ? 'bg-red-100 text-red-800 border border-red-200' :
                                                                    getStatusColor(selectedOrder.status) === 'indigo' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                                                                        'bg-gray-100 text-gray-800 border border-gray-200'
                                                        }`}>
                                                        {getStatusName(selectedOrder.status)}
                                                    </span>
                                                </p>
                                                <p className="text-sm">
                                                    <span className="font-medium text-gray-600 inline-block w-32">Thanh toán:</span> {getPaymentMethodName(selectedOrder.paymentMethod)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Chi tiết trạng thái đơn hàng */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                        <h3 className="text-xl font-medium text-gray-800 mb-6 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            Tiến trình đơn hàng
                                        </h3>
                                        <div className="relative">
                                            <div className="absolute left-5 top-0 h-full w-1 bg-gray-200 rounded-full"></div>

                                            <div className={`mb-8 ml-10 relative ${selectedOrder.status === 'pending' || selectedOrder.status === 'processing' || selectedOrder.status === 'shipping' || selectedOrder.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                                                <div className="absolute -left-5 mt-1">
                                                    <div className={`flex items-center justify-center w-9 h-9 rounded-full ${selectedOrder.status === 'pending' || selectedOrder.status === 'processing' || selectedOrder.status === 'shipping' || selectedOrder.status === 'delivered' ? 'bg-green-100' : 'bg-gray-100'} border-2 ${selectedOrder.status === 'pending' || selectedOrder.status === 'processing' || selectedOrder.status === 'shipping' || selectedOrder.status === 'delivered' ? 'border-green-500' : 'border-gray-300'}`}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${selectedOrder.status === 'pending' || selectedOrder.status === 'processing' || selectedOrder.status === 'shipping' || selectedOrder.status === 'delivered' ? 'text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="ml-6">
                                                    <h4 className="font-medium text-lg">Đơn hàng đã được tiếp nhận</h4>
                                                    <p className="text-sm text-gray-500 mt-1">Đơn hàng của bạn đã được hệ thống ghi nhận</p>
                                                </div>
                                            </div>

                                            <div className={`mb-8 ml-10 relative ${selectedOrder.status === 'processing' || selectedOrder.status === 'shipping' || selectedOrder.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                                                <div className="absolute -left-5 mt-1">
                                                    <div className={`flex items-center justify-center w-9 h-9 rounded-full ${selectedOrder.status === 'processing' || selectedOrder.status === 'shipping' || selectedOrder.status === 'delivered' ? 'bg-green-100' : 'bg-gray-100'} border-2 ${selectedOrder.status === 'processing' || selectedOrder.status === 'shipping' || selectedOrder.status === 'delivered' ? 'border-green-500' : 'border-gray-300'}`}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${selectedOrder.status === 'processing' || selectedOrder.status === 'shipping' || selectedOrder.status === 'delivered' ? 'text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="ml-6">
                                                    <h4 className="font-medium text-lg">Đang xử lý</h4>
                                                    <p className="text-sm text-gray-500 mt-1">Đơn hàng của bạn đang được chuẩn bị</p>
                                                </div>
                                            </div>

                                            <div className={`mb-8 ml-10 relative ${selectedOrder.status === 'shipping' || selectedOrder.status === 'delivered' ? 'text-green-600' : 'text-gray-400'}`}>
                                                <div className="absolute -left-5 mt-1">
                                                    <div className={`flex items-center justify-center w-9 h-9 rounded-full ${selectedOrder.status === 'shipping' || selectedOrder.status === 'delivered' ? 'bg-green-100' : 'bg-gray-100'} border-2 ${selectedOrder.status === 'shipping' || selectedOrder.status === 'delivered' ? 'border-green-500' : 'border-gray-300'}`}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${selectedOrder.status === 'shipping' || selectedOrder.status === 'delivered' ? 'text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="ml-6">
                                                    <h4 className="font-medium text-lg">Đang giao hàng</h4>
                                                    <p className="text-sm text-gray-500 mt-1">Đơn hàng của bạn đang được giao đến địa chỉ nhận hàng</p>
                                                </div>
                                            </div>

                                            <div className={`ml-10 relative ${selectedOrder.status === 'delivered' ? 'text-green-600' : selectedOrder.status === 'cancelled' ? 'text-red-600' : 'text-gray-400'}`}>
                                                <div className="absolute -left-5 mt-1">
                                                    <div className={`flex items-center justify-center w-9 h-9 rounded-full ${selectedOrder.status === 'delivered' ? 'bg-green-100' : selectedOrder.status === 'cancelled' ? 'bg-red-100' : 'bg-gray-100'} border-2 ${selectedOrder.status === 'delivered' ? 'border-green-500' : selectedOrder.status === 'cancelled' ? 'border-red-500' : 'border-gray-300'}`}>
                                                        {selectedOrder.status === 'cancelled' ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${selectedOrder.status === 'delivered' ? 'text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="ml-6">
                                                    <h4 className="font-medium text-lg">
                                                        {selectedOrder.status === 'cancelled' ? 'Đơn hàng đã bị hủy' : 'Giao hàng thành công'}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {selectedOrder.status === 'cancelled' ? 'Đơn hàng đã bị hủy' : 'Đơn hàng đã được giao thành công'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Danh sách sản phẩm */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                        <h3 className="text-xl font-medium text-gray-800 mb-6 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                            Sản phẩm đã đặt
                                        </h3>
                                        <div className="overflow-x-auto rounded-lg border border-gray-100">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Sản phẩm
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Đơn giá
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Số lượng
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Thành tiền
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {selectedOrder.items && selectedOrder.items.map((item: any, index: number) => (
                                                        <tr key={index} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center">
                                                                    {item.image && (
                                                                        <img className="h-14 w-14 rounded-lg object-cover mr-3 border border-gray-200 shadow-sm" src={item.image} alt={item.name} />
                                                                    )}
                                                                    <div>
                                                                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                                        {item.productId && (
                                                                            <div className="text-xs text-gray-500 mt-1">ID: {item.productId}</div>
                                                                        )}
                                                                        {item.warrantyPeriodMonths > 0 && (
                                                                            <div className="text-xs text-blue-600 mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded">
                                                                                Bảo hành: {item.warrantyPeriodMonths} tháng
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                                                {formatPrice(item.price)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                                                <span className="bg-gray-100 px-3 py-1 rounded-full">{item.quantity}</span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                                                {formatPrice(item.price * item.quantity)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-gray-50">
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                                            Tạm tính:
                                                        </td>
                                                        <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                                            {formatPrice(selectedOrder.itemsPrice ||
                                                                selectedOrder.items.reduce((total, item) => total + (item.price * item.quantity), 0))}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                                            Phí vận chuyển:
                                                        </td>
                                                        <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                                            {formatPrice(selectedOrder.shippingPrice || 0)}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td colSpan={3} className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                                                            Tổng cộng:
                                                        </td>
                                                        <td className="px-6 py-3 whitespace-nowrap text-right text-base font-bold text-blue-600">
                                                            {formatPrice(selectedOrder.totalAmount || selectedOrder.totalPrice)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Thông tin giao hàng */}
                                    <div className="bg-gray-50 p-6 rounded-xl shadow-inner">
                                        <h3 className="text-xl font-medium text-gray-800 mb-4 pb-2 border-b border-gray-200 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            Thông tin giao hàng
                                        </h3>
                                        {selectedOrder.shippingAddress ? (
                                            <div className="grid grid-cols-1 gap-3 bg-white p-4 rounded-lg border border-gray-100">
                                                <p className="text-sm flex">
                                                    <span className="font-medium text-gray-600 inline-block w-32">Người nhận:</span>
                                                    <span className="font-medium">{selectedOrder.shippingAddress.fullName || 'Không có thông tin'}</span>
                                                </p>
                                                <p className="text-sm flex">
                                                    <span className="font-medium text-gray-600 inline-block w-32">Số điện thoại:</span>
                                                    <span>{selectedOrder.shippingAddress.phone || 'Không có thông tin'}</span>
                                                </p>
                                                <p className="text-sm flex items-start">
                                                    <span className="font-medium text-gray-600 inline-block w-32">Địa chỉ:</span>
                                                    <span className="flex-1 break-words">
                                                        {selectedOrder.shippingAddress.address ? (
                                                            <>
                                                                {selectedOrder.shippingAddress.address}
                                                            </>
                                                        ) : (
                                                            'Không có thông tin địa chỉ'
                                                        )}
                                                    </span>
                                                </p>
                                                {selectedOrder.shippingAddress.notes && (
                                                    <p className="text-sm flex items-start">
                                                        <span className="font-medium text-gray-600 inline-block w-32">Ghi chú:</span>
                                                        <span className="italic text-gray-600">{selectedOrder.shippingAddress.notes}</span>
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 bg-white p-4 rounded-lg border border-gray-100">Không có thông tin giao hàng</p>
                                        )}
                                    </div>

                                    <div className="text-right pt-6 border-t border-gray-200 mt-6">
                                        <button
                                            onClick={closeModal}
                                            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                        >
                                            Đóng
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserOrders; 