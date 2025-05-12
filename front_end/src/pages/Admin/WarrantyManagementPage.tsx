import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { orderAPI } from '../../services/orders';

interface WarrantyClaim {
    _id: string;
    orderItemId: string;
    productName: string;
    serialNumber: string;
    customerName: string;
    customerPhone: string;
    description: string;
    status: string;
    images: string[];
    createdAt: string;
    updatedAt: string;
    warrantyPeriodMonths: number;
    warrantyEndDate: string;
}

interface ProductUnderWarranty {
    productId: string;
    productName: string;
    serialNumber: string;
    orderId: string;
    orderNumber: string;
    customer: {
        id: string;
        name: string;
        phone: string;
    };
    warrantyStartDate: string;
    warrantyEndDate: string;
    warrantyPeriodMonths: number;
    remainingDays: number;
    warrantyPercentage: number;
    orderDate: string;
    deliveryDate: string;
}

type TabView = 'claims' | 'products';

const WarrantyManagementPage: React.FC = () => {
    // State cho tab hiện tại
    const [activeTab, setActiveTab] = useState<TabView>('claims');

    // State cho yêu cầu bảo hành
    const [claims, setClaims] = useState<WarrantyClaim[]>([]);
    const [claimsLoading, setClaimsLoading] = useState<boolean>(true);
    const [claimsPage, setClaimsPage] = useState<number>(1);
    const [claimsTotalPages, setClaimsTotalPages] = useState<number>(1);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [statusUpdate, setStatusUpdate] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    // State cho sản phẩm đang bảo hành
    const [products, setProducts] = useState<ProductUnderWarranty[]>([]);
    const [productsLoading, setProductsLoading] = useState<boolean>(true);
    const [productsPage, setProductsPage] = useState<number>(1);
    const [productsTotalPages, setProductsTotalPages] = useState<number>(1);

    useEffect(() => {
        if (activeTab === 'claims') {
            fetchWarrantyClaims();
        } else if (activeTab === 'products') {
            fetchProductsUnderWarranty();
        }
    }, [activeTab, claimsPage, filterStatus, productsPage]);

    const fetchWarrantyClaims = async () => {
        try {
            setClaimsLoading(true);
            const status = filterStatus !== 'all' ? filterStatus : undefined;
            const response = await orderAPI.getAllWarrantyClaims(claimsPage, 10, status);

            if (response.data.success) {
                const transformedClaims = response.data.data.map(claim => ({
                    _id: claim._id,
                    orderItemId: claim.orderItemId || '',
                    productName: claim.productName,
                    serialNumber: claim.serialNumber,
                    customerName: claim.contactName || claim.customerName,
                    customerPhone: claim.contactPhone || claim.customerPhone,
                    description: claim.description,
                    status: claim.status,
                    images: claim.images || [],
                    createdAt: claim.createdAt,
                    updatedAt: claim.updatedAt,
                    warrantyPeriodMonths: claim.warrantyPeriodMonths || 0,
                    warrantyEndDate: claim.warrantyEndDate
                }));

                setClaims(transformedClaims);
                setClaimsTotalPages(Math.ceil(response.data.total / 10));
            } else {
                toast.error(response.data.message || 'Lỗi khi tải danh sách bảo hành');
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách bảo hành:', error);
            toast.error('Đã xảy ra lỗi khi tải danh sách bảo hành');
        } finally {
            setClaimsLoading(false);
        }
    };

    const fetchProductsUnderWarranty = async () => {
        try {
            setProductsLoading(true);
            const response = await orderAPI.getProductsUnderWarranty(productsPage, 10);

            if (response.data.success) {
                setProducts(response.data.data);
                setProductsTotalPages(Math.ceil(response.data.total / 10));
            } else {
                toast.error(response.data.message || 'Lỗi khi tải danh sách sản phẩm đang bảo hành');
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách sản phẩm đang bảo hành:', error);
            toast.error('Đã xảy ra lỗi khi tải danh sách sản phẩm đang bảo hành');
        } finally {
            setProductsLoading(false);
        }
    };

    const handleTabChange = (tab: TabView) => {
        setActiveTab(tab);
    };

    const handleClaimsPageChange = (page: number) => {
        setClaimsPage(page);
    };

    const handleProductsPageChange = (page: number) => {
        setProductsPage(page);
    };

    const handleFilter = (status: string) => {
        setFilterStatus(status);
        setClaimsPage(1);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchWarrantyClaims();
    };

    const openModal = (claim: WarrantyClaim) => {
        setSelectedClaim(claim);
        setStatusUpdate(claim.status);
        setNotes('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedClaim(null);
    };

    const handleStatusChange = async () => {
        if (!selectedClaim || !statusUpdate) return;

        try {
            const response = await orderAPI.updateWarrantyStatus(
                selectedClaim._id,
                statusUpdate,
                notes
            );

            if (response.data.success) {
                toast.success('Cập nhật trạng thái bảo hành thành công');
                fetchWarrantyClaims();
                closeModal();
            } else {
                toast.error(response.data.message || 'Lỗi khi cập nhật trạng thái');
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái bảo hành:', error);
            toast.error('Đã xảy ra lỗi khi cập nhật trạng thái bảo hành');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'request':
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Đang chờ xử lý
                    </span>
                );
            case 'under_review':
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Đang xem xét
                    </span>
                );
            case 'approved':
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Đã duyệt
                    </span>
                );
            case 'sending':
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        Đang gửi đi
                    </span>
                );
            case 'received':
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                        Đã nhận
                    </span>
                );
            case 'processing':
            case 'in_progress':
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
                        Đang xử lý
                    </span>
                );
            case 'completed':
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Hoàn thành
                    </span>
                );
            case 'rejected':
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Từ chối bảo hành
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {status}
                    </span>
                );
        }
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 90) return 'bg-red-600';
        if (percentage >= 70) return 'bg-orange-500';
        if (percentage >= 50) return 'bg-yellow-400';
        return 'bg-green-500';
    };

    // Render các tab chuyển đổi giữa yêu cầu bảo hành và sản phẩm đang bảo hành
    const renderTabs = () => {
        return (
            <div className="flex space-x-2 mb-6">
                <button
                    onClick={() => handleTabChange('claims')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'claims'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                >
                    Yêu cầu bảo hành
                </button>
                <button
                    onClick={() => handleTabChange('products')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'products'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                >
                    Sản phẩm đang bảo hành
                </button>
            </div>
        );
    };

    // Component hiển thị danh sách sản phẩm đang bảo hành
    const renderProductsUnderWarranty = () => {
        if (productsLoading) {
            return (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            );
        }

        if (products.length === 0) {
            return (
                <div className="bg-white rounded-xl shadow-md p-8 text-center">
                    <p className="text-gray-500">Không có sản phẩm nào đang trong thời gian bảo hành</p>
                </div>
            );
        }

        return (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sản phẩm
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Khách hàng
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Bảo hành
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thời gian còn lại
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {products.map((product) => (
                                <tr key={product.serialNumber} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                                        <div className="text-xs text-gray-500">SN: {product.serialNumber}</div>
                                        <div className="text-xs text-gray-500">Đơn hàng: {product.orderNumber}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{product.customer.name}</div>
                                        <div className="text-xs text-gray-500">{product.customer.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{product.warrantyPeriodMonths} tháng</div>
                                        <div className="text-xs text-gray-500">
                                            {formatDate(product.warrantyStartDate)} - {formatDate(product.warrantyEndDate)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{product.remainingDays} ngày</div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                                            <div
                                                className={`h-2.5 rounded-full ${getProgressColor(product.warrantyPercentage)}`}
                                                style={{ width: `${product.warrantyPercentage}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-gray-500">Đã sử dụng {product.warrantyPercentage}%</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link
                                            to={`/admin/orders/${product.orderId}`}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            Xem đơn hàng
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                {productsTotalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    Trang <span className="font-medium">{productsPage}</span> / <span className="font-medium">{productsTotalPages}</span>
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => handleProductsPageChange(Math.max(1, productsPage - 1))}
                                        disabled={productsPage === 1}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${productsPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        Trước
                                    </button>
                                    {[...Array(productsTotalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleProductsPageChange(i + 1)}
                                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${productsPage === i + 1
                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                : 'text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => handleProductsPageChange(Math.min(productsTotalPages, productsPage + 1))}
                                        disabled={productsPage === productsTotalPages}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${productsPage === productsTotalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        Sau
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Quản lý bảo hành</h1>
                <p className="text-gray-600">Quản lý yêu cầu bảo hành và theo dõi thời gian bảo hành sản phẩm.</p>
            </div>

            {/* Tab Navigation */}
            {renderTabs()}

            {/* Tab Content */}
            {activeTab === 'claims' ? (
                <>
                    {/* Filter and Search for Claims */}
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                        <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0">
                            <div className="flex items-center space-x-4">
                                <h2 className="text-lg font-semibold text-gray-800">Lọc theo trạng thái:</h2>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => handleFilter('all')}
                                        className={`px-3 py-1 rounded-md text-sm transition-colors ${filterStatus === 'all'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                            }`}
                                    >
                                        Tất cả
                                    </button>
                                    <button
                                        onClick={() => handleFilter('request')}
                                        className={`px-3 py-1 rounded-md text-sm transition-colors ${filterStatus === 'request'
                                            ? 'bg-yellow-500 text-white'
                                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                            }`}
                                    >
                                        Yêu cầu mới
                                    </button>
                                    <button
                                        onClick={() => handleFilter('under_review')}
                                        className={`px-3 py-1 rounded-md text-sm transition-colors ${filterStatus === 'under_review'
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                            }`}
                                    >
                                        Đang xem xét
                                    </button>
                                    <button
                                        onClick={() => handleFilter('approved')}
                                        className={`px-3 py-1 rounded-md text-sm transition-colors ${filterStatus === 'approved'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                            }`}
                                    >
                                        Đã duyệt
                                    </button>
                                    <button
                                        onClick={() => handleFilter('sending')}
                                        className={`px-3 py-1 rounded-md text-sm transition-colors ${filterStatus === 'sending'
                                            ? 'bg-indigo-500 text-white'
                                            : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                                            }`}
                                    >
                                        Đang gửi đi
                                    </button>
                                    <button
                                        onClick={() => handleFilter('received')}
                                        className={`px-3 py-1 rounded-md text-sm transition-colors ${filterStatus === 'received'
                                            ? 'bg-teal-500 text-white'
                                            : 'bg-teal-100 text-teal-800 hover:bg-teal-200'
                                            }`}
                                    >
                                        Đã nhận
                                    </button>
                                    <button
                                        onClick={() => handleFilter('processing')}
                                        className={`px-3 py-1 rounded-md text-sm transition-colors ${filterStatus === 'processing'
                                            ? 'bg-cyan-500 text-white'
                                            : 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200'
                                            }`}
                                    >
                                        Đang xử lý
                                    </button>
                                    <button
                                        onClick={() => handleFilter('completed')}
                                        className={`px-3 py-1 rounded-md text-sm transition-colors ${filterStatus === 'completed'
                                            ? 'bg-green-500 text-white'
                                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                                            }`}
                                    >
                                        Hoàn thành
                                    </button>
                                    <button
                                        onClick={() => handleFilter('rejected')}
                                        className={`px-3 py-1 rounded-md text-sm transition-colors ${filterStatus === 'rejected'
                                            ? 'bg-red-500 text-white'
                                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                                            }`}
                                    >
                                        Từ chối
                                    </button>
                                </div>
                            </div>
                            <form onSubmit={handleSearch} className="flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo tên khách hàng, sản phẩm..."
                                    className="border border-gray-300 rounded-md px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
                                >
                                    Tìm kiếm
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Warranty Claims Table */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="overflow-x-auto">
                            {claimsLoading ? (
                                <div className="flex items-center justify-center py-10">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                                    <p className="ml-2 text-gray-600">Đang tải dữ liệu...</p>
                                </div>
                            ) : claims.length === 0 ? (
                                <div className="text-center py-10">
                                    <svg
                                        className="mx-auto h-12 w-12 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">Không có yêu cầu bảo hành</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Hiện không có yêu cầu bảo hành nào phù hợp với bộ lọc.
                                    </p>
                                </div>
                            ) : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                Sản phẩm
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                Khách hàng
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                Serial Number
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                Ngày tạo
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                Hạn bảo hành
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                Trạng thái
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                            >
                                                Thao tác
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {claims.map((claim) => (
                                            <tr key={claim._id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="text-sm font-medium text-gray-900">{claim.productName}</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{claim.customerName}</div>
                                                    <div className="text-sm text-gray-500">{claim.customerPhone}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{claim.serialNumber}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{formatDate(claim.createdAt)}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{formatDate(claim.warrantyEndDate)}</div>
                                                    <div className="text-xs text-gray-500">{claim.warrantyPeriodMonths} tháng</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(claim.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => openModal(claim)}
                                                        className="text-blue-600 hover:text-blue-900 mr-3"
                                                    >
                                                        Chi tiết
                                                    </button>
                                                    <Link
                                                        to={`/admin/warranty/${claim._id}`}
                                                        className="text-indigo-600 hover:text-indigo-900"
                                                    >
                                                        Xem đầy đủ
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Pagination */}
                        {claimsTotalPages > 1 && (
                            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => handleClaimsPageChange(Math.max(1, claimsPage - 1))}
                                        disabled={claimsPage === 1}
                                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${claimsPage === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        Trước
                                    </button>
                                    <button
                                        onClick={() => handleClaimsPageChange(Math.min(claimsTotalPages, claimsPage + 1))}
                                        disabled={claimsPage === claimsTotalPages}
                                        className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${claimsPage === claimsTotalPages
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        Sau
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Hiển thị <span className="font-medium">{claims.length}</span> kết quả
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                            <button
                                                onClick={() => handleClaimsPageChange(Math.max(1, claimsPage - 1))}
                                                disabled={claimsPage === 1}
                                                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${claimsPage === 1
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <span className="sr-only">Trước</span>
                                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                            {Array.from({ length: claimsTotalPages }, (_, i) => i + 1).map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => handleClaimsPageChange(page)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === claimsPage
                                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => handleClaimsPageChange(Math.min(claimsTotalPages, claimsPage + 1))}
                                                disabled={claimsPage === claimsTotalPages}
                                                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${claimsPage === claimsTotalPages
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <span className="sr-only">Sau</span>
                                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Products Under Warranty Content */
                renderProductsUnderWarranty()
            )}

            {/* Modal for warranty detail */}
            {isModalOpen && (
                <div className="fixed inset-0 overflow-y-auto z-50">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                                            Cập nhật trạng thái bảo hành
                                        </h3>
                                        <div className="mb-4">
                                            <p className="text-sm text-gray-500 mb-1">Sản phẩm: <span className="font-medium text-gray-900">{selectedClaim?.productName}</span></p>
                                            <p className="text-sm text-gray-500 mb-1">Khách hàng: <span className="font-medium text-gray-900">{selectedClaim?.customerName}</span></p>
                                            <p className="text-sm text-gray-500 mb-3">Mô tả: <span className="font-medium text-gray-900">{selectedClaim?.description}</span></p>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái mới</label>
                                                <select
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={statusUpdate}
                                                    onChange={(e) => setStatusUpdate(e.target.value)}
                                                >
                                                    <option value="request">Yêu cầu mới</option>
                                                    <option value="under_review">Đang xem xét</option>
                                                    <option value="approved">Đã duyệt</option>
                                                    <option value="sending">Đang gửi đi</option>
                                                    <option value="received">Đã nhận</option>
                                                    <option value="processing">Đang xử lý</option>
                                                    <option value="completed">Hoàn thành</option>
                                                    <option value="rejected">Từ chối</option>
                                                </select>
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                                                <textarea
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    rows={4}
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    placeholder="Thêm ghi chú cho việc cập nhật trạng thái..."
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={handleStatusChange}
                                >
                                    Cập nhật
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={closeModal}
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarrantyManagementPage; 