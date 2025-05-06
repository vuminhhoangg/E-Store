import React, { useState, useEffect, useLayoutEffect } from 'react';
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
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Đóng dropdown khi component unmount hoặc khi filter/search/trang thay đổi
    useEffect(() => {
        // Đóng dropdown khi có bất kỳ thay đổi nào về dữ liệu hiển thị
        setActiveDropdown(null);
    }, [searchTerm, statusFilter, currentPage, refreshData]);

    // Sử dụng useLayoutEffect để đảm bảo đóng dropdown xảy ra trước khi render
    useLayoutEffect(() => {
        // Hàm xử lý sự kiện scroll - đóng dropdown khi người dùng cuộn trang
        const handleScroll = () => {
            if (activeDropdown) {
                setActiveDropdown(null);
            }
        };

        // Đăng ký sự kiện scroll
        window.addEventListener('scroll', handleScroll);

        // Hủy đăng ký khi component unmount
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [activeDropdown]);

    // Xử lý đóng dropdown khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeDropdown && !(event.target as Element).closest('.order-actions-dropdown')) {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeDropdown]);

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
                // Kiểm tra token từ cả userInfo và user_info
                const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo') ||
                    localStorage.getItem('user_info') || sessionStorage.getItem('user_info');

                if (!userInfoStr) {
                    console.error('Không tìm thấy thông tin đăng nhập');
                    setError('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn');
                    setLoading(false);
                    return;
                }

                console.log('Thông tin đăng nhập:', userInfoStr);
                const userInfo = JSON.parse(userInfoStr);
                console.log('Thông tin người dùng sau khi parse:', userInfo);

                // Kiểm tra token, hỗ trợ cả 2 định dạng
                const token = userInfo.accessToken || userInfo.token;

                if (!token) {
                    console.error('Không tìm thấy access token', userInfo);
                    setError('Phiên đăng nhập không hợp lệ');
                    setLoading(false);
                    return;
                }

                console.log('Gọi API lấy danh sách đơn hàng với token:', token.substring(0, 20) + '...');

                // Thêm logic retry khi gặp lỗi
                let retries = 0;
                const maxRetries = 3;
                let success = false;
                let response;

                while (!success && retries < maxRetries) {
                    try {
                        response = await axios.get('/api/orders', {
                            headers: {
                                Authorization: `Bearer ${token}`
                            },
                            params: {
                                page: currentPage,
                                limit: ordersPerPage,
                                status: statusFilter !== 'all' ? statusFilter : undefined
                            },
                            timeout: 30000 // Tăng timeout lên 30 giây
                        });
                        success = true;
                    } catch (error) {
                        retries++;
                        console.log(`Lần thử ${retries}/${maxRetries} thất bại, đang thử lại...`);
                        if (retries >= maxRetries) throw error;
                        // Đợi 1 giây trước khi thử lại
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }

                console.log('Kết quả API:', response.data);

                // Xử lý dữ liệu trả về từ API
                let orderData = response.data.data || [];

                // Kiểm tra và chuyển đổi định dạng nếu cần
                if (orderData.length > 0) {
                    // Kiểm tra xem dữ liệu đã ở định dạng cần thiết chưa
                    const firstOrder = orderData[0];
                    if (!firstOrder.user || !firstOrder.totalAmount) {
                        console.log('Dữ liệu đơn hàng không ở định dạng chuẩn, đang chuyển đổi...');

                        // Chuyển đổi định dạng
                        orderData = orderData.map((order: any) => ({
                            _id: order._id,
                            user: {
                                _id: order.userId?._id || 'unknown',
                                userName: order.userId?.userName || order.userId?.phoneNumber || 'Không xác định'
                            },
                            totalAmount: order.totalPrice || 0,
                            items: order.items || [],
                            status: order.status,
                            paymentMethod: order.paymentMethod,
                            createdAt: order.createdAt,
                            deliveryAddress: order.shippingAddress ?
                                `${order.shippingAddress.address}, ${order.shippingAddress.ward}, ${order.shippingAddress.district}, ${order.shippingAddress.city}` :
                                'Không có địa chỉ'
                        }));
                    }
                }

                console.log('Dữ liệu đơn hàng sau khi xử lý:', orderData);
                setOrders(orderData);
                if (response.data.totalPages) {
                    setTotalPages(response.data.totalPages);
                }
                setError(null); // Xóa lỗi nếu thành công
                setLoading(false);
            } catch (error: any) {
                console.error('Lỗi khi lấy danh sách đơn hàng:', error);

                // Lưu chi tiết lỗi để debug
                const errorDetails = {
                    message: error.message,
                    stack: error.stack,
                    request: error.request ? {
                        method: error.config?.method,
                        url: error.config?.url,
                        data: error.config?.data,
                    } : 'Không có thông tin request'
                };
                console.error('Chi tiết lỗi:', JSON.stringify(errorDetails, null, 2));

                // Xử lý các loại lỗi khác nhau
                if (error.response) {
                    console.error('Lỗi response:', {
                        data: error.response.data,
                        status: error.response.status,
                        headers: error.response.headers
                    });

                    if (error.response.status === 401) {
                        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                    } else if (error.response.status === 403) {
                        setError('Bạn không có quyền truy cập chức năng này.');
                        toast.error('Bạn không có quyền truy cập chức năng này.');
                    } else if (error.response.status === 500) {
                        setError('Lỗi máy chủ. Vui lòng thử lại sau hoặc liên hệ quản trị viên.');
                        toast.error('Lỗi máy chủ. Vui lòng thử lại sau hoặc liên hệ quản trị viên.');
                    } else {
                        setError(`Lỗi từ server: ${error.response.data?.message || error.response.statusText || 'Không xác định'}`);
                        toast.error(`Lỗi từ server: ${error.response.data?.message || error.response.statusText || 'Không xác định'}`);
                    }
                } else if (error.request) {
                    console.error('Không nhận được phản hồi từ server');
                    setError('Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet hoặc thử lại sau.');
                    toast.error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet hoặc thử lại sau.');
                } else {
                    console.error('Lỗi khi thiết lập request:', error.message);
                    setError(`Lỗi: ${error.message}`);
                    toast.error(`Lỗi: ${error.message}`);
                }

                setOrders([]); // Đặt orders là mảng rỗng khi có lỗi
                setLoading(false);
            }
        };

        fetchOrders();
    }, [refreshData, statusFilter, currentPage, ordersPerPage]);

    // Cập nhật trạng thái đơn hàng
    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            // Kiểm tra token từ cả userInfo và user_info
            const userInfoStr = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo') ||
                localStorage.getItem('user_info') || sessionStorage.getItem('user_info');

            if (!userInfoStr) {
                console.error('Không tìm thấy thông tin đăng nhập');
                toast.error('Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn');
                return;
            }

            const userInfo = JSON.parse(userInfoStr);
            // Kiểm tra token, hỗ trợ cả 2 định dạng
            const token = userInfo.accessToken || userInfo.token;

            if (!token) {
                console.error('Không tìm thấy access token', userInfo);
                toast.error('Phiên đăng nhập không hợp lệ');
                return;
            }

            // Config cho request với token
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
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
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
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

    // Toggle dropdown cho nút cập nhật
    const toggleDropdown = (orderId: string, event: React.MouseEvent<HTMLButtonElement>) => {
        // Ngăn chặn sự kiện lan truyền
        event.stopPropagation();

        if (activeDropdown === orderId) {
            setActiveDropdown(null);
        } else {
            // Đóng dropdown đang mở
            setActiveDropdown(null);

            // Delay để đảm bảo dropdown trước đó đã đóng
            setTimeout(() => {
                // Mở dropdown mới
                setActiveDropdown(orderId);
            }, 10);
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
            <div className="bg-white rounded-lg shadow-md p-4 mb-6 border border-gray-200">
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

                    <div className="order-status-filter-container">
                        {orderStatuses.map((status) => {
                            let buttonClass = "order-status-filter-button ";
                            const isActive = statusFilter === status.id;

                            // Thêm class active nếu đang được chọn
                            if (isActive) {
                                buttonClass += "order-status-filter-button-active ";
                            }

                            // Màu sắc dựa trên loại trạng thái
                            switch (status.color) {
                                case 'gray':
                                    buttonClass += isActive ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200';
                                    break;
                                case 'yellow':
                                    buttonClass += isActive ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
                                    break;
                                case 'blue':
                                    buttonClass += isActive ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200';
                                    break;
                                case 'indigo':
                                    buttonClass += isActive ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
                                    break;
                                case 'green':
                                    buttonClass += isActive ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200';
                                    break;
                                case 'red':
                                    buttonClass += isActive ? 'bg-red-600 text-white' : 'bg-red-100 text-red-800 hover:bg-red-200';
                                    break;
                                default:
                                    buttonClass += isActive ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200';
                            }

                            return (
                                <button
                                    key={status.id}
                                    onClick={(e) => {
                                        setStatusFilter(status.id);
                                        setCurrentPage(1);
                                    }}
                                    className={buttonClass}
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
                <div className="admin-table-card">
                    <div className="admin-table-responsive-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th className="order-table-col-id">Mã đơn</th>
                                    <th className="order-table-col-customer">Khách hàng</th>
                                    <th className="order-table-col-price">Tổng tiền</th>
                                    <th className="order-table-col-items">Số sản phẩm</th>
                                    <th className="order-table-col-payment">Thanh toán</th>
                                    <th className="order-table-col-status">Trạng thái</th>
                                    <th className="order-table-col-date">Ngày đặt</th>
                                    <th className="order-table-col-actions">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 relative">
                                {currentOrders.map((order: Order) => (
                                    <tr key={order._id} className="hover:bg-gray-50">
                                        <td className="order-id font-medium text-blue-600">
                                            {order._id}
                                        </td>
                                        <td className="customer-info">
                                            <div className="font-medium">{order.user.userName}</div>
                                            <div className="text-sm text-gray-500 truncate">
                                                {order.deliveryAddress}
                                            </div>
                                        </td>
                                        <td className="font-semibold text-gray-900">
                                            {formatPrice(order.totalAmount)}
                                        </td>
                                        <td className="text-center">
                                            {order.items.length}
                                        </td>
                                        <td className="payment-method">
                                            {order.paymentMethod}
                                        </td>
                                        <td className="order-status">
                                            {(() => {
                                                let badgeClass = "";
                                                let icon = null;

                                                switch (getStatusColor(order.status)) {
                                                    case 'gray':
                                                        badgeClass = 'admin-badge-gray';
                                                        icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>;
                                                        break;
                                                    case 'yellow':
                                                        badgeClass = 'admin-badge-yellow';
                                                        icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>;
                                                        break;
                                                    case 'blue':
                                                        badgeClass = 'admin-badge-blue';
                                                        icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                                        </svg>;
                                                        break;
                                                    case 'indigo':
                                                        badgeClass = 'bg-indigo-100 text-indigo-800 border border-indigo-200 admin-badge';
                                                        icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                        </svg>;
                                                        break;
                                                    case 'green':
                                                        badgeClass = 'admin-badge-green';
                                                        icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>;
                                                        break;
                                                    case 'red':
                                                        badgeClass = 'admin-badge-red';
                                                        icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>;
                                                        break;
                                                    default:
                                                        badgeClass = 'admin-badge-gray';
                                                        icon = <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>;
                                                }
                                                return (
                                                    <span className={badgeClass}>
                                                        {icon}
                                                        {getStatusName(order.status)}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="order-date">
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td>
                                            <div className="order-action-buttons">
                                                <button
                                                    className="order-action-button-view"
                                                    onClick={() => viewOrderDetails(order)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    </svg>
                                                    Chi tiết
                                                </button>

                                                {/* Nút cập nhật trạng thái */}
                                                {(order.status !== 'delivered' && order.status !== 'cancelled') && (
                                                    <div className="order-actions-dropdown">
                                                        <button
                                                            className="order-action-button-update"
                                                            onClick={(e) => toggleDropdown(order._id, e)}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            Cập nhật
                                                        </button>
                                                        <div
                                                            className={`order-actions-dropdown-content ${activeDropdown === order._id ? 'visible' : ''}`}
                                                        >
                                                            <div className="py-0.5 bg-white rounded-md shadow-lg" role="menu" aria-orientation="vertical" style={{ zIndex: 1500 }}>
                                                                {getNextStatusOptions(order.status).map(nextStatus => (
                                                                    <button
                                                                        key={nextStatus}
                                                                        className={`order-action-button ${nextStatus === 'cancelled' ? 'order-action-button-danger' : ''}`}
                                                                        onClick={() => {
                                                                            updateOrderStatus(order._id, nextStatus);
                                                                            setActiveDropdown(null);
                                                                        }}
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
                                    className={`pagination-button px-3 py-1 ${currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Trước
                                </button>

                                {[...Array(totalPages)].map((_, i) => {
                                    // Chỉ hiển thị các nút phân trang xung quanh trang hiện tại
                                    if (
                                        i === 0 || // luôn hiển thị trang đầu
                                        i === totalPages - 1 || // luôn hiển thị trang cuối
                                        (i >= currentPage - 2 && i <= currentPage + 2) // hiển thị 2 trang trước và sau trang hiện tại
                                    ) {
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => paginate(i + 1)}
                                                className={`pagination-button px-3 py-1 ${currentPage === i + 1
                                                    ? 'pagination-button-active'
                                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                            >
                                                {i + 1}
                                            </button>
                                        );
                                    } else if (
                                        (i === 1 && currentPage > 3) || // hiển thị dấu ... sau trang đầu tiên
                                        (i === totalPages - 2 && currentPage < totalPages - 3) // hiển thị dấu ... trước trang cuối cùng
                                    ) {
                                        return (
                                            <span key={i} className="px-2 py-1 text-gray-500">
                                                ...
                                            </span>
                                        );
                                    }
                                    return null;
                                })}

                                <button
                                    onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                                    disabled={currentPage === totalPages}
                                    className={`pagination-button px-3 py-1 ${currentPage === totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`}
                                >
                                    Sau
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
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
                        <div className="order-summary-container">
                            <div className="order-summary-card">
                                <h3 className="order-summary-title">Thông tin đơn hàng</h3>
                                <div className="space-y-2">
                                    <div className="order-summary-field">
                                        <span className="order-summary-label">Mã đơn hàng:</span>
                                        <span className="order-summary-value">{selectedOrder._id}</span>
                                    </div>
                                    <div className="order-summary-field">
                                        <span className="order-summary-label">Ngày đặt:</span>
                                        <span className="order-summary-value">{formatDate(selectedOrder.createdAt)}</span>
                                    </div>
                                    <div className="order-summary-field">
                                        <span className="order-summary-label">Trạng thái:</span>
                                        <span className={`ml-2 ${getStatusColor(selectedOrder.status) === 'yellow' ? 'admin-badge-yellow' :
                                            getStatusColor(selectedOrder.status) === 'blue' ? 'admin-badge-blue' :
                                                getStatusColor(selectedOrder.status) === 'green' ? 'admin-badge-green' :
                                                    getStatusColor(selectedOrder.status) === 'red' ? 'admin-badge-red' :
                                                        getStatusColor(selectedOrder.status) === 'indigo' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200 admin-badge' :
                                                            'admin-badge-gray'
                                            }`}
                                        >
                                            {getStatusName(selectedOrder.status)}
                                        </span>
                                    </div>
                                    <div className="order-summary-field">
                                        <span className="order-summary-label">Tổng tiền:</span>
                                        <span className="order-summary-value font-semibold">{formatPrice(selectedOrder.totalAmount)}</span>
                                    </div>
                                    {selectedOrder.paymentMethod && (
                                        <div className="order-summary-field">
                                            <span className="order-summary-label">Phương thức thanh toán:</span>
                                            <span className="order-summary-value">{selectedOrder.paymentMethod}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="order-summary-card">
                                <h3 className="order-summary-title">Thông tin khách hàng</h3>
                                <div className="space-y-2">
                                    <div className="order-summary-field">
                                        <span className="order-summary-label">Họ tên:</span>
                                        <span className="order-summary-value">{selectedOrder.user.userName}</span>
                                    </div>
                                    <div className="order-summary-field">
                                        <span className="order-summary-label">ID khách hàng:</span>
                                        <span className="order-summary-value">{selectedOrder.user._id}</span>
                                    </div>

                                    {selectedOrder.deliveryAddress && (
                                        <div className="mt-4">
                                            <h4 className="text-md font-semibold mb-2 text-gray-700">Địa chỉ giao hàng</h4>
                                            <p className="text-sm text-gray-600 break-words">{selectedOrder.deliveryAddress}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="order-summary-card">
                            <h3 className="order-summary-title">Sản phẩm đã đặt</h3>
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
                                                    <div className="order-item-container">
                                                        {item.image && (
                                                            <img className="order-item-image" src={item.image} alt={item.name} />
                                                        )}
                                                        <div>
                                                            <div className="order-item-name">{item.name}</div>
                                                            {item.productId && (
                                                                <div className="order-item-id">ID: {item.productId}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-right">{formatPrice(item.price)}</td>
                                                <td className="text-center">{item.quantity}</td>
                                                <td className="text-right font-medium">{formatPrice(item.price * item.quantity)}</td>
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
                            {(selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled') && (
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
                            )}
                        </div>
                    </div>
                )}
            </AdminModal>
        </div>
    );
};

export default OrderManagement; 