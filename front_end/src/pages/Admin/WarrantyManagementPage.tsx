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

const WarrantyManagementPage: React.FC = () => {
    const [claims, setClaims] = useState<WarrantyClaim[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedClaim, setSelectedClaim] = useState<WarrantyClaim | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [statusUpdate, setStatusUpdate] = useState<string>('');
    const [notes, setNotes] = useState<string>('');

    useEffect(() => {
        fetchWarrantyClaims();
    }, [currentPage, filterStatus]);

    const fetchWarrantyClaims = async () => {
        try {
            setLoading(true);
            const status = filterStatus !== 'all' ? filterStatus : undefined;
            const response = await orderAPI.getAllWarrantyClaims(currentPage, 10, status);

            if (response.data.success) {
                setClaims(response.data.data);
                setTotalPages(Math.ceil(response.data.total / 10));
            } else {
                toast.error(response.data.message || 'Lỗi khi tải danh sách bảo hành');
            }
        } catch (error) {
            console.error('Lỗi khi tải danh sách bảo hành:', error);
            toast.error('Đã xảy ra lỗi khi tải danh sách bảo hành');
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = (status: string) => {
        setFilterStatus(status);
        setCurrentPage(1);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchWarrantyClaims();
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
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
            case 'pending':
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Đang chờ xử lý
                    </span>
                );
            case 'processing':
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Quản lý bảo hành</h1>
                <p className="text-gray-600">Quản lý tất cả các yêu cầu bảo hành sản phẩm.</p>
            </div>

            {/* Filter and Search */}
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
                                onClick={() => handleFilter('pending')}
                                className={`px-3 py-1 rounded-md text-sm transition-colors ${filterStatus === 'pending'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                    }`}
                            >
                                Đang chờ xử lý
                            </button>
                            <button
                                onClick={() => handleFilter('processing')}
                                className={`px-3 py-1 rounded-md text-sm transition-colors ${filterStatus === 'processing'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                                    }`}
                            >
                                Đang xử lý
                            </button>
                            <button
                                onClick={() => handleFilter('completed')}
                                className={`px-3 py-1 rounded-md text-sm transition-colors ${filterStatus === 'completed'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                    }`}
                            >
                                Hoàn thành
                            </button>
                            <button
                                onClick={() => handleFilter('rejected')}
                                className={`px-3 py-1 rounded-md text-sm transition-colors ${filterStatus === 'rejected'
                                    ? 'bg-red-600 text-white'
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
                            placeholder="Tìm theo tên khách hàng hoặc sản phẩm..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Tìm kiếm
                        </button>
                    </form>
                </div>
            </div>

            {/* Warranty Claims Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
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
                {totalPages > 1 && (
                    <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === 1
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Trước
                            </button>
                            <button
                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${currentPage === totalPages
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
                                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${currentPage === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-white text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="sr-only">Trước</span>
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${page === currentPage
                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${currentPage === totalPages
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

            {/* Modal for warranty detail */}
            {isModalOpen && selectedClaim && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Chi tiết bảo hành</h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-gray-600 text-sm">Sản phẩm:</p>
                                    <p className="font-medium">{selectedClaim.productName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Serial Number:</p>
                                    <p className="font-medium">{selectedClaim.serialNumber}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Khách hàng:</p>
                                    <p className="font-medium">{selectedClaim.customerName}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Số điện thoại:</p>
                                    <p className="font-medium">{selectedClaim.customerPhone}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Ngày tạo:</p>
                                    <p className="font-medium">{formatDate(selectedClaim.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-gray-600 text-sm">Hạn bảo hành:</p>
                                    <p className="font-medium">{formatDate(selectedClaim.warrantyEndDate)}</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <p className="text-gray-600 text-sm mb-1">Mô tả vấn đề:</p>
                                <p className="bg-gray-50 p-3 rounded-lg text-gray-800">{selectedClaim.description}</p>
                            </div>

                            {selectedClaim.images && selectedClaim.images.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-gray-600 text-sm mb-2">Hình ảnh:</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                        {selectedClaim.images.map((image, index) => (
                                            <a
                                                key={index}
                                                href={image}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block overflow-hidden rounded-lg h-24 bg-gray-100"
                                            >
                                                <img
                                                    src={image}
                                                    alt={`Hình ảnh ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-gray-200 pt-4">
                                <h3 className="font-medium text-gray-800 mb-3">Cập nhật trạng thái</h3>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="status">
                                        Trạng thái:
                                    </label>
                                    <select
                                        id="status"
                                        value={statusUpdate}
                                        onChange={(e) => setStatusUpdate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="pending">Đang chờ xử lý</option>
                                        <option value="processing">Đang xử lý</option>
                                        <option value="completed">Hoàn thành</option>
                                        <option value="rejected">Từ chối bảo hành</option>
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="notes">
                                        Ghi chú:
                                    </label>
                                    <textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nhập ghi chú về việc xử lý bảo hành..."
                                    />
                                </div>
                                <div className="flex justify-end space-x-3">
                                    <button
                                        onClick={closeModal}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        onClick={handleStatusChange}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                    >
                                        Cập nhật
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarrantyManagementPage; 