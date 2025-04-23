import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import AdminModal from '../../components/AdminModal';

// Định nghĩa interfaces
interface OrderStatus {
    id: string;
    name: string;
    color: string;
}

interface OrderUser {
    _id: string;
    userName: string;
}

interface Order {
    _id: string;
    user: OrderUser;
    totalAmount: number;
    items: any[];
    status: string;
    paymentMethod: string;
    createdAt: string;
    deliveryAddress: string;
    isBlocked?: boolean;
}

const OrderManagement = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage] = useState(10);
    const [refreshData, setRefreshData] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState<string | null>(null);

    // Danh sách trạng thái đơn hàng
    const orderStatuses: OrderStatus[] = [
        { id: 'all', name: 'Tất cả', color: 'gray' },
        { id: 'pending', name: 'Chờ xác nhận', color: 'yellow' },
        { id: 'processing', name: 'Đang xử lý', color: 'blue' },
        { id: 'shipping', name: 'Đang giao hàng', color: 'indigo' },
        { id: 'delivered', name: 'Đã giao hàng', color: 'green' },
        { id: 'cancelled', name: 'Đã hủy', color: 'red' },
    ];

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                // Kiểm tra token
                const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
                if (!userInfoStr) {
                    console.error('Không tìm thấy thông tin đăng nhập');
                    toast.error('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn');
                    setLoading(false);
                    return;
                }

                const userInfo = JSON.parse(userInfoStr);
                if (!userInfo.accessToken) {
                    console.error('Không tìm thấy access token');
                    toast.error('Phiên đăng nhập không hợp lệ');
                    setLoading(false);
                    return;
                }

                console.log('Gọi API lấy danh sách đơn hàng');
                const response = await axios.get('/api/orders', {
                    headers: {
                        Authorization: `Bearer ${userInfo.accessToken}`
                    }
                });

                console.log('Kết quả API:', response.data);
                setOrders(response.data.data || []);
                if (response.data.totalPages) {
                    setTotalPages(response.data.totalPages);
                }
                setLoading(false);
            } catch (error: any) {
                console.error('Lỗi khi lấy danh sách đơn hàng:', error);

                // Xử lý các loại lỗi khác nhau
                if (error.response) {
                    console.error('Lỗi response:', {
                        data: error.response.data,
                        status: error.response.status,
                        headers: error.response.headers
                    });
                    toast.error(`Lỗi từ server: ${error.response.data?.message || error.response.statusText || 'Không xác định'}`);
                } else if (error.request) {
                    console.error('Không nhận được phản hồi từ server');
                    toast.error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet hoặc thử lại sau.');
                } else {
                    console.error('Lỗi khi thiết lập request:', error.message);
                    toast.error(`Lỗi: ${error.message}`);
                }

                setLoading(false);
            }
        };

        fetchOrders();
    }, [refreshData, statusFilter, currentPage, ordersPerPage]);

    // Cập nhật trạng thái đơn hàng
    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            // Kiểm tra token
            const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
            if (!userInfoStr) {
                console.error('Không tìm thấy thông tin đăng nhập');
                toast.error('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn');
                return;
            }

            const userInfo = JSON.parse(userInfoStr);
            if (!userInfo.accessToken) {
                console.error('Không tìm thấy access token');
                toast.error('Phiên đăng nhập không hợp lệ');
                return;
            }

            // Config cho request với token
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userInfo.accessToken}`,
                },
            };

            // Gọi API để cập nhật trạng thái
            console.log(`Cập nhật trạng thái đơn hàng ${orderId} thành ${newStatus}`);
            await axios.put(`/api/orders/${orderId}/status`, { status: newStatus }, config);

            // Cập nhật UI
            setOrders(orders.map(order =>
                order._id === orderId ? { ...order, status: newStatus } : order
            ));

            toast.success('Đã cập nhật trạng thái đơn hàng thành công');
        } catch (error: any) {
            console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);

            if (error.response?.data?.message) {
                toast.error(`Lỗi: ${error.response.data.message}`);
            } else {
                toast.error('Không thể cập nhật trạng thái đơn hàng');
            }
        }
    };

    // Xem chi tiết đơn hàng
    const viewOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setDetailsModalOpen(true);
    };

    // Format tiền tệ VND
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    // Format ngày tháng
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleDateString('vi-VN', options);
    };

    // Lọc orders theo từ khóa tìm kiếm và trạng thái
    const filteredOrders = orders.filter((order: Order) => {
        const { _id, user, status: orderStatus } = order;
        const term = searchTerm.toLowerCase();
        const statusMatch = statusFilter === 'all' || orderStatus === statusFilter;

        return statusMatch && (
            _id.toLowerCase().includes(term) ||
            user.userName.toLowerCase().includes(term)
        );
    });

    // Logic phân trang
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);

    // Xử lý khi chuyển trang
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    // Trả về tên hiển thị của trạng thái
    const getStatusName = (status: string) => {
        const statusObj = orderStatuses.find(s => s.id === status);
        return statusObj ? statusObj.name : 'Không xác định';
    };

    // Trả về màu của trạng thái
    const getStatusColor = (status: string) => {
        const statusObj = orderStatuses.find(s => s.id === status);
        return statusObj ? statusObj.color : 'gray';
    };

    // Xác định các trạng thái tiếp theo có thể có dựa vào trạng thái hiện tại
    const getNextStatusOptions = (currentStatus: string): string[] => {
        switch (currentStatus) {
            case 'pending':
                return ['processing', 'cancelled'];
            case 'processing':
                return ['shipping', 'cancelled'];
            case 'shipping':
                return ['delivered', 'cancelled'];
            case 'delivered':
                return [];
            case 'cancelled':
                return [];
            default:
                return ['pending', 'processing', 'shipping', 'delivered', 'cancelled'];
        }
    };

    return (
        <div>
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-5" role="alert">
                    <p>{error}</p>
                </div>
            )}

            {/* Phần header và bộ lọc */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h2 className="text-xl font-bold text-gray-800">Quản lý đơn hàng</h2>
                </div>

                <div className="mt-4 flex flex-col md:flex-row gap-4">
                    <div className="md:flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Tìm kiếm theo mã đơn hàng, tên khách hàng..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                            <div className="absolute left-3 top-2.5 text-gray-400">
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {orderStatuses.map((status) => {
                            let buttonClass = "";
                            if (statusFilter === status.id) {
                                // Nếu đang được chọn
                                switch (status.color) {
                                    case 'gray': buttonClass = 'bg-gray-600 text-white'; break;
                                    case 'yellow': buttonClass = 'bg-yellow-600 text-white'; break;
                                    case 'blue': buttonClass = 'bg-blue-600 text-white'; break;
                                    case 'indigo': buttonClass = 'bg-indigo-600 text-white'; break;
                                    case 'green': buttonClass = 'bg-green-600 text-white'; break;
                                    case 'red': buttonClass = 'bg-red-600 text-white'; break;
                                    default: buttonClass = 'bg-gray-600 text-white';
                                }
                            } else {
                                // Nếu không được chọn
                                switch (status.color) {
                                    case 'gray': buttonClass = 'bg-gray-100 text-gray-800 hover:bg-gray-200'; break;
                                    case 'yellow': buttonClass = 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'; break;
                                    case 'blue': buttonClass = 'bg-blue-100 text-blue-800 hover:bg-blue-200'; break;
                                    case 'indigo': buttonClass = 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'; break;
                                    case 'green': buttonClass = 'bg-green-100 text-green-800 hover:bg-green-200'; break;
                                    case 'red': buttonClass = 'bg-red-100 text-red-800 hover:bg-red-200'; break;
                                    default: buttonClass = 'bg-gray-100 text-gray-800 hover:bg-gray-200';
                                }
                            }

                            return (
                                <button
                                    key={status.id}
                                    onClick={() => {
                                        setStatusFilter(status.id);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium ${buttonClass}`}
                                >
                                    {status.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Danh sách đơn hàng */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="admin-card">
                    <div className="overflow-x-auto">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Khách hàng</th>
                                    <th>Tổng tiền</th>
                                    <th>Số SP</th>
                                    <th>Thanh toán</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày đặt</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentOrders.map((order: Order) => (
                                    <tr key={order._id} className="hover:bg-gray-50">
                                        <td className="font-medium text-blue-600">
                                            {order._id}
                                        </td>
                                        <td>
                                            <div className="font-medium">{order.user.userName}</div>
                                            <div className="text-sm text-gray-500 truncate max-w-[200px]">
                                                {order.deliveryAddress}
                                            </div>
                                        </td>
                                        <td className="font-semibold text-gray-900">
                                            {formatPrice(order.totalAmount)}
                                        </td>
                                        <td>
                                            {order.items.length}
                                        </td>
                                        <td>
                                            {order.paymentMethod}
                                        </td>
                                        <td>
                                            {(() => {
                                                let badgeClass = "";
                                                switch (getStatusColor(order.status)) {
                                                    case 'gray': badgeClass = 'admin-badge-gray'; break;
                                                    case 'yellow': badgeClass = 'admin-badge-yellow'; break;
                                                    case 'blue': badgeClass = 'admin-badge-blue'; break;
                                                    case 'indigo': badgeClass = 'bg-indigo-100 text-indigo-800'; break;
                                                    case 'green': badgeClass = 'admin-badge-green'; break;
                                                    case 'red': badgeClass = 'admin-badge-red'; break;
                                                    default: badgeClass = 'admin-badge-gray';
                                                }
                                                return (
                                                    <span className={`admin-badge ${badgeClass}`}>
                                                        {getStatusName(order.status)}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td>
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td>
                                            <div className="flex flex-col space-y-2">
                                                <button
                                                    className="text-blue-600 hover:text-blue-900"
                                                    onClick={() => viewOrderDetails(order)}
                                                >
                                                    Chi tiết
                                                </button>

                                                {/* Dropdown cho trạng thái đơn hàng */}
                                                {(order.status !== 'delivered' && order.status !== 'cancelled') && (
                                                    <div className="relative group">
                                                        <button className="text-green-600 hover:text-green-900">
                                                            Cập nhật
                                                        </button>
                                                        <div className="absolute z-10 left-0 mt-1 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 invisible group-hover:visible">
                                                            <div className="py-1" role="menu" aria-orientation="vertical">
                                                                {getNextStatusOptions(order.status).map(nextStatus => (
                                                                    <button
                                                                        key={nextStatus}
                                                                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${nextStatus === 'cancelled' ? 'text-red-600' : 'text-gray-700'}`}
                                                                        onClick={() => updateOrderStatus(order._id, nextStatus)}
                                                                    >
                                                                        {getStatusName(nextStatus)}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {currentOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="text-center py-10 text-gray-500">
                                            Không tìm thấy đơn hàng nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Hiển thị{' '}
                                    <span className="font-medium">{indexOfFirstOrder + 1}</span>
                                    {' '}-{' '}
                                    <span className="font-medium">
                                        {indexOfLastOrder > filteredOrders.length
                                            ? filteredOrders.length
                                            : indexOfLastOrder}
                                    </span>{' '}
                                    trong {filteredOrders.length} kết quả
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 rounded-md ${currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Trước
                                </button>

                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => paginate(i + 1)}
                                        className={`px-3 py-1 rounded-md ${currentPage === i + 1
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}

                                <button
                                    onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1 rounded-md ${currentPage === totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Modal cập nhật đơn hàng */}
            <AdminModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title="Cập nhật trạng thái đơn hàng"
            >
                {selectedOrder && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Thông tin đơn hàng</h3>
                            <p><span className="font-medium">Mã đơn hàng:</span> {selectedOrder._id}</p>
                            <p><span className="font-medium">Khách hàng:</span> {selectedOrder.user.userName}</p>
                            <p><span className="font-medium">Tổng tiền:</span> {formatPrice(selectedOrder.totalAmount)}</p>
                        </div>

                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                Chọn trạng thái mới
                            </label>
                            <select
                                id="status"
                                value={selectedOrder.status}
                                onChange={(e) => updateOrderStatus(selectedOrder._id, e.target.value as string)}
                                className="admin-select mt-1"
                            >
                                {orderStatuses.map(status => (
                                    status.id !== 'all' && (
                                        <option key={status.id} value={status.id}>
                                            {status.name}
                                        </option>
                                    )
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setModalOpen(false)}
                                className="admin-btn-secondary"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setModalOpen(false);
                                    setRefreshData(prev => !prev);
                                }}
                                className="admin-btn-success"
                            >
                                Cập nhật
                            </button>
                        </div>
                    </div>
                )}
            </AdminModal>

            {/* Modal chi tiết đơn hàng */}
            <AdminModal
                isOpen={detailsModalOpen}
                onClose={() => setDetailsModalOpen(false)}
                title="Chi tiết đơn hàng"
                size="lg"
            >
                {selectedOrder && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">Thông tin đơn hàng</h3>
                                <div className="space-y-1">
                                    <p><span className="font-medium">Mã đơn hàng:</span> {selectedOrder._id}</p>
                                    <p><span className="font-medium">Ngày đặt:</span> {formatDate(selectedOrder.createdAt)}</p>
                                    <p><span className="font-medium">Trạng thái:</span>
                                        <span className={`ml-2 admin-badge ${getStatusColor(selectedOrder.status) === 'yellow' ? 'admin-badge-yellow' :
                                            getStatusColor(selectedOrder.status) === 'blue' ? 'admin-badge-blue' :
                                                getStatusColor(selectedOrder.status) === 'green' ? 'admin-badge-green' :
                                                    getStatusColor(selectedOrder.status) === 'red' ? 'admin-badge-red' :
                                                        'admin-badge-gray'
                                            }`}
                                        >
                                            {getStatusName(selectedOrder.status)}
                                        </span>
                                    </p>
                                    <p><span className="font-medium">Tổng tiền:</span> {formatPrice(selectedOrder.totalAmount)}</p>
                                    {selectedOrder.paymentMethod && (
                                        <p><span className="font-medium">Phương thức thanh toán:</span> {selectedOrder.paymentMethod}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-2">Thông tin khách hàng</h3>
                                <div className="space-y-1">
                                    <p><span className="font-medium">Họ tên:</span> {selectedOrder.user.userName}</p>
                                    <p><span className="font-medium">Email:</span> {selectedOrder.user.userName}@example.com</p>
                                </div>

                                {selectedOrder.deliveryAddress && (
                                    <div className="mt-4">
                                        <h3 className="text-lg font-semibold mb-2">Địa chỉ giao hàng</h3>
                                        <p>{selectedOrder.deliveryAddress}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Sản phẩm đã đặt</h3>
                            <div className="overflow-x-auto">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Sản phẩm</th>
                                            <th>Đơn giá</th>
                                            <th>Số lượng</th>
                                            <th>Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.items && selectedOrder.items.map((item, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <div className="flex items-center">
                                                        {item.image && (
                                                            <img className="h-10 w-10 rounded-full mr-2" src={item.image} alt={item.name} />
                                                        )}
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                            {item.productId && (
                                                                <div className="text-sm text-gray-500">ID: {item.productId}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{formatPrice(item.price)}</td>
                                                <td>{item.quantity}</td>
                                                <td>{formatPrice(item.price * item.quantity)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-3">
                            <button
                                type="button"
                                onClick={() => setDetailsModalOpen(false)}
                                className="admin-btn-secondary"
                            >
                                Đóng
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setDetailsModalOpen(false);
                                    setModalOpen(true);
                                }}
                                className="admin-btn-primary"
                            >
                                Cập nhật trạng thái
                            </button>
                        </div>
                    </div>
                )}
            </AdminModal>
        </div>
    );
};

export default OrderManagement; 