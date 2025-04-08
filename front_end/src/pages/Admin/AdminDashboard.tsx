import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Không cần kiểm tra token ở mỗi component Admin vì:
// 1. AdminProtectedRoute đã xác thực quyền admin trước khi vào /admin
// 2. AdminLayout làm một lần xác thực nữa khi tải trang
// 3. Token được tự động thêm vào header bởi axios interceptor trong API service

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        userCount: 0,
        productCount: 0,
        orderCount: 0,
        recentOrders: [],
        lowStockProducts: [],
        revenue: 0
    });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mô phỏng lấy dữ liệu từ API
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Trong thực tế, bạn sẽ gọi API để lấy dữ liệu từ server
                // const response = await axios.get('/api/admin/dashboard');
                // setStats(response.data);

                // Dữ liệu giả cho mục đích demo
                setTimeout(() => {
                    setStats({
                        userCount: 124,
                        productCount: 45,
                        orderCount: 38,
                        revenue: 85600000,
                        recentOrders: [
                            { id: 'ORD-001', date: '2023-11-05', total: 2500000, status: 'Đã thanh toán', customer: 'Nguyễn Văn A' },
                            { id: 'ORD-002', date: '2023-11-04', total: 1800000, status: 'Đang xử lý', customer: 'Trần Thị B' },
                            { id: 'ORD-003', date: '2023-11-04', total: 3200000, status: 'Đã giao hàng', customer: 'Lê Văn C' },
                            { id: 'ORD-004', date: '2023-11-03', total: 950000, status: 'Đã thanh toán', customer: 'Phạm Thị D' },
                        ],
                        lowStockProducts: [
                            { id: 'P-001', name: 'iPhone 14 Pro', stock: 5, price: 28000000 },
                            { id: 'P-002', name: 'Samsung Galaxy S23', stock: 3, price: 21500000 },
                            { id: 'P-003', name: 'MacBook Air M2', stock: 2, price: 32000000 },
                        ]
                    });
                    setLoading(false);
                }, 1000);
            } catch (error) {
                console.error('Lỗi khi tải dữ liệu dashboard:', error);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    // Format tiền tệ VND
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // Hàm xác định màu nền cho biểu tượng thống kê
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Đã thanh toán':
                return 'admin-badge-green';
            case 'Đang xử lý':
                return 'admin-badge-yellow';
            case 'Đã giao hàng':
                return 'admin-badge-blue';
            default:
                return 'admin-badge-gray';
        }
    };

    return (
        <div className="max-w-full">
            {loading ? (
                <div className="flex justify-center items-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    {/* Thẻ thống kê */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Thẻ 1: Tổng doanh thu */}
                        <div className="admin-stat-card animate-fadeInUp">
                            <div className="admin-stat-icon bg-green-100 text-green-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-5">
                                <p className="admin-stat-label">Tổng doanh thu</p>
                                <p className="admin-stat-value text-green-600">{formatCurrency(stats.revenue)}</p>
                            </div>
                        </div>

                        {/* Thẻ 2: Tổng người dùng */}
                        <div className="admin-stat-card animate-fadeInUp animation-delay-100">
                            <div className="admin-stat-icon bg-blue-100 text-blue-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div className="ml-5">
                                <p className="admin-stat-label">Người dùng</p>
                                <p className="admin-stat-value text-blue-600">{stats.userCount}</p>
                            </div>
                        </div>

                        {/* Thẻ 3: Sản phẩm */}
                        <div className="admin-stat-card animate-fadeInUp animation-delay-200">
                            <div className="admin-stat-icon bg-indigo-100 text-indigo-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                                </svg>
                            </div>
                            <div className="ml-5">
                                <p className="admin-stat-label">Sản phẩm</p>
                                <p className="admin-stat-value text-indigo-600">{stats.productCount}</p>
                            </div>
                        </div>

                        {/* Thẻ 4: Đơn hàng */}
                        <div className="admin-stat-card animate-fadeInUp animation-delay-300">
                            <div className="admin-stat-icon bg-purple-100 text-purple-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <div className="ml-5">
                                <p className="admin-stat-label">Đơn hàng</p>
                                <p className="admin-stat-value text-purple-600">{stats.orderCount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Đơn hàng gần đây & Sản phẩm sắp hết hàng */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Đơn hàng gần đây */}
                        <div className="admin-card animate-fadeInUp animation-delay-100">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Đơn hàng gần đây
                                </h2>
                                <Link to="/admin/orders" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                                    Xem tất cả
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Mã đơn</th>
                                            <th>Khách hàng</th>
                                            <th>Ngày</th>
                                            <th>Tổng tiền</th>
                                            <th>Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recentOrders.map((order: any, index: number) => (
                                            <tr key={order.id} className={`animate-fadeInUp animation-delay-${(index + 1) * 100}`}>
                                                <td className="font-medium text-blue-600">
                                                    <Link to={`/admin/orders/${order.id}`} className="hover:underline">
                                                        {order.id}
                                                    </Link>
                                                </td>
                                                <td>{order.customer}</td>
                                                <td>{order.date}</td>
                                                <td className="font-medium">{formatCurrency(order.total)}</td>
                                                <td>
                                                    <span className={`admin-badge ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Sản phẩm sắp hết hàng */}
                        <div className="admin-card animate-fadeInUp animation-delay-200">
                            <div className="admin-card-header">
                                <h2 className="admin-card-title flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    Sản phẩm sắp hết hàng
                                </h2>
                                <Link to="/admin/products" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                                    Quản lý kho
                                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Mã SP</th>
                                            <th>Tên sản phẩm</th>
                                            <th>Tồn kho</th>
                                            <th>Giá</th>
                                            <th>Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.lowStockProducts.map((product: any, index: number) => (
                                            <tr key={product.id} className={`animate-fadeInUp animation-delay-${(index + 1) * 100}`}>
                                                <td className="font-medium">{product.id}</td>
                                                <td>{product.name}</td>
                                                <td>
                                                    <span className={`admin-badge ${product.stock <= 2 ? 'admin-badge-red' : 'admin-badge-yellow'}`}>
                                                        {product.stock} sản phẩm
                                                    </span>
                                                </td>
                                                <td className="font-medium">{formatCurrency(product.price)}</td>
                                                <td>
                                                    <Link to={`/admin/products/edit/${product.id}`}
                                                        className="admin-btn-primary py-1.5 px-3 text-xs hover:shadow-md transition-all">
                                                        <svg className="w-3 h-3 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                        </svg>
                                                        Nhập thêm
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AdminDashboard; 