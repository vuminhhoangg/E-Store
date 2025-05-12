import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { warrantyAPI } from '../services/warranty';
import { FaTools, FaSpinner, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaFileAlt, FaPlus, FaHistory, FaCalendarAlt, FaInfoCircle, FaAngleRight, FaShieldAlt } from 'react-icons/fa';
import { orderAPI } from '../services/orders';

interface WarrantyItem {
    _id: string;
    orderId: string;
    orderItemId: string;
    productName: string;
    description: string;
    status: string;
    images: string[];
    createdAt: string;
    updatedAt: string;
    contactName: string;
    contactPhone: string;
    contactEmail?: string;
    contactAddress: string;
    serialNumber?: string;
    notes?: string[];
    claimNumber?: string;
    orderNumber?: string;
    warrantyEndDate?: string;
}

const WarrantyHistoryPage: React.FC = () => {
    const [warrantyHistory, setWarrantyHistory] = useState<WarrantyItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [selectedWarranty, setSelectedWarranty] = useState<WarrantyItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWarrantyClaims = async () => {
            try {
                setIsLoading(true);
                setError('');
                console.log('Đang tải dữ liệu yêu cầu bảo hành...');

                const response = await orderAPI.getUserWarrantyClaims();

                if (response.success && response.data) {
                    console.log(`Đã tải ${response.data.length} yêu cầu bảo hành`);
                    setWarrantyHistory(response.data);
                } else {
                    console.error('Lỗi khi tải dữ liệu:', response.message);
                    setError(response.message || 'Không thể tải dữ liệu yêu cầu bảo hành');
                }
            } catch (err) {
                console.error('Lỗi khi tải yêu cầu bảo hành:', err);
                setError('Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchWarrantyClaims();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Đang chờ xử lý
            case 'processing':
                return 'bg-blue-100 text-blue-800 border-blue-200'; // Đang xử lý
            case 'approved':
                return 'bg-green-100 text-green-800 border-green-200'; // Đã phê duyệt
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-200'; // Từ chối
            case 'completed':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200'; // Hoàn thành
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusGradient = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'from-yellow-500 to-amber-600'; // Đang chờ xử lý
            case 'processing':
                return 'from-blue-500 to-indigo-600'; // Đang xử lý
            case 'approved':
                return 'from-green-500 to-emerald-600'; // Đã phê duyệt
            case 'rejected':
                return 'from-red-500 to-rose-600'; // Từ chối
            case 'completed':
                return 'from-emerald-500 to-teal-600'; // Hoàn thành
            default:
                return 'from-gray-500 to-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return <FaSpinner className="inline-block mr-1 animate-spin" />;
            case 'processing':
                return <FaTools className="inline-block mr-1" />;
            case 'approved':
                return <FaCheckCircle className="inline-block mr-1" />;
            case 'rejected':
                return <FaTimesCircle className="inline-block mr-1" />;
            case 'completed':
                return <FaCheckCircle className="inline-block mr-1" />;
            default:
                return <FaExclamationTriangle className="inline-block mr-1" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'Đang chờ xử lý';
            case 'processing':
                return 'Đang xử lý';
            case 'approved':
                return 'Đã phê duyệt';
            case 'rejected':
                return 'Từ chối';
            case 'completed':
                return 'Hoàn thành';
            default:
                return status;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const filteredWarranties = warrantyHistory.filter(warranty => {
        if (activeTab === 'all') return true;
        return warranty.status.toLowerCase() === activeTab;
    });

    const openDetailModal = (warranty: WarrantyItem) => {
        console.log('Chi tiết yêu cầu bảo hành:', warranty);
        setSelectedWarranty(warranty);
        setIsModalOpen(true);
    };

    const closeDetailModal = () => {
        setIsModalOpen(false);
        setSelectedWarranty(null);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-50 to-purple-100 py-12 px-4 sm:px-6 lg:px-8 animate-gradient-x">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-3 transform transition-all duration-500 animate-fade-in-down">Lịch Sử Yêu Cầu Bảo Hành</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">Theo dõi trạng thái các yêu cầu bảo hành của bạn một cách dễ dàng</p>
                    <div className="w-20 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mt-4 rounded-full"></div>
                </div>

                {/* Nút tạo yêu cầu bảo hành mới */}
                <div className="text-right mb-8 animate-fade-in-up">
                    <Link
                        to="/warranty-request"
                        className="inline-flex items-center px-5 py-3 border border-transparent rounded-full shadow-lg text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 hover:text-white hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400"
                    >
                        <FaPlus className="mr-2 h-4 w-4" />
                        <span className="font-semibold">Tạo yêu cầu bảo hành mới</span>
                    </Link>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-lg mb-8 p-1 transform transition-all duration-500 animate-fade-in-up">
                    <nav className="flex flex-wrap">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 rounded-lg py-3 px-5 font-medium text-sm transition-all duration-300 ${activeTab === 'all'
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md transform scale-105'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-indigo-600'
                                }`}
                        >
                            <span className="flex items-center justify-center">
                                <FaHistory className={`mr-2 ${activeTab === 'all' ? 'animate-pulse' : ''}`} />
                                Tất cả
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`flex-1 rounded-lg py-3 px-5 font-medium text-sm transition-all duration-300 ${activeTab === 'pending'
                                ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md transform scale-105'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-amber-500'
                                }`}
                        >
                            <span className="flex items-center justify-center">
                                <FaSpinner className={`mr-2 ${activeTab === 'pending' ? 'animate-spin' : ''}`} />
                                Đang chờ xử lý
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('processing')}
                            className={`flex-1 rounded-lg py-3 px-5 font-medium text-sm transition-all duration-300 ${activeTab === 'processing'
                                ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-md transform scale-105'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-blue-500'
                                }`}
                        >
                            <span className="flex items-center justify-center">
                                <FaTools className={`mr-2 ${activeTab === 'processing' ? 'animate-pulse' : ''}`} />
                                Đang xử lý
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`flex-1 rounded-lg py-3 px-5 font-medium text-sm transition-all duration-300 ${activeTab === 'completed'
                                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md transform scale-105'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-emerald-500'
                                }`}
                        >
                            <span className="flex items-center justify-center">
                                <FaCheckCircle className={`mr-2 ${activeTab === 'completed' ? 'animate-pulse' : ''}`} />
                                Hoàn thành
                            </span>
                        </button>
                    </nav>
                </div>

                {loading ? (
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center animate-pulse">
                        <div className="flex justify-center">
                            <div className="relative w-20 h-20">
                                <div className="absolute inset-0 rounded-full border-t-4 border-b-4 border-indigo-200"></div>
                                <div className="absolute inset-0 rounded-full border-t-4 border-indigo-600 animate-spin"></div>
                            </div>
                        </div>
                        <p className="mt-6 text-gray-600 font-medium">Đang tải dữ liệu bảo hành...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12 px-6 bg-white rounded-2xl shadow-lg border border-red-100 transform transition-all duration-500 animate-fade-in-up">
                        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <FaExclamationTriangle className="h-8 w-8 text-red-500" />
                        </div>
                        <p className="text-xl font-medium text-red-600 mb-3">{error}</p>
                        <p className="text-gray-600 mb-6">Vui lòng thử lại sau hoặc liên hệ bộ phận hỗ trợ</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Tải lại trang
                        </button>
                    </div>
                ) : warrantyHistory.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-100 transform transition-all duration-500 animate-fade-in-up">
                        <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <FaFileAlt className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-medium text-gray-900 mb-3">Chưa có yêu cầu bảo hành</h3>
                        <p className="text-gray-600 max-w-xl mx-auto mb-8">
                            Bạn chưa có yêu cầu bảo hành nào. Nếu sản phẩm của bạn gặp vấn đề và còn trong thời gian bảo hành, hãy tạo yêu cầu mới.
                        </p>
                        <Link
                            to="/warranty-request"
                            className="inline-flex items-center px-5 py-3 border border-transparent rounded-full shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:text-white hover:shadow-lg transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <FaPlus className="mr-2" /> Tạo yêu cầu bảo hành mới
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in-up">
                        {filteredWarranties.map((warranty, index) => (
                            <div
                                key={warranty._id}
                                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                                onClick={() => openDetailModal(warranty)}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className={`h-2 bg-gradient-to-r ${getStatusGradient(warranty.status)}`}></div>
                                <div className="p-5">
                                    <div className="flex flex-col md:flex-row justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center mb-2">
                                                <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br ${getStatusGradient(warranty.status)} flex items-center justify-center mr-3`}>
                                                    {getStatusIcon(warranty.status)}
                                                </div>
                                                <h3 className="text-lg font-semibold text-gray-900 truncate">{warranty.productName}</h3>
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-3 ml-13">
                                                {warranty.description}
                                            </p>
                                            <div className="flex flex-wrap gap-3 items-center text-xs text-gray-500">
                                                <span className="flex items-center">
                                                    <FaCalendarAlt className="mr-1 text-indigo-500" />
                                                    {formatDate(warranty.createdAt)}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full border ${getStatusColor(warranty.status)} flex items-center`}>
                                                    {getStatusText(warranty.status)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="md:ml-4 flex items-end justify-end mt-4 md:mt-0">
                                            <div className="rounded-full bg-indigo-50 p-2 text-indigo-600 hover:bg-indigo-100 transition-colors duration-200">
                                                <FaAngleRight className="h-5 w-5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal chi tiết yêu cầu bảo hành */}
            {isModalOpen && selectedWarranty && (
                <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
                    <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={closeDetailModal}>
                        <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
                    </div>

                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-auto overflow-hidden transform transition-all duration-300 animate-modal-in">
                        <div className="absolute right-4 top-4 z-10">
                            <button
                                onClick={closeDetailModal}
                                className="bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none hover:rotate-90 transform transition-transform"
                            >
                                <svg className="h-6 w-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className={`h-3 bg-gradient-to-r ${getStatusGradient(selectedWarranty.status)}`}></div>

                        <div className="p-6">
                            <div className="flex items-center mb-6">
                                <div className={`flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br ${getStatusGradient(selectedWarranty.status)} flex items-center justify-center mr-4 shadow-lg animate-pulse-slow`}>
                                    <div className="text-white text-2xl">
                                        {getStatusIcon(selectedWarranty.status)}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        Chi tiết yêu cầu bảo hành
                                    </h3>
                                    <p className={`mt-1 text-sm inline-flex items-center px-3 py-1 rounded-full ${getStatusColor(selectedWarranty.status)}`}>
                                        {getStatusText(selectedWarranty.status)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-blue-100 shadow-inner">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md">
                                        <p className="text-sm font-medium text-gray-500 mb-1">Sản phẩm</p>
                                        <p className="font-medium text-gray-900">{selectedWarranty.productName}</p>
                                    </div>

                                    {selectedWarranty.serialNumber && (
                                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md">
                                            <p className="text-sm font-medium text-gray-500 mb-1">Số serial</p>
                                            <p className="font-medium text-indigo-600 font-mono">{selectedWarranty.serialNumber}</p>
                                        </div>
                                    )}

                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md">
                                        <p className="text-sm font-medium text-gray-500 mb-1">Ngày tạo yêu cầu</p>
                                        <p className="font-medium text-gray-900 flex items-center">
                                            <FaCalendarAlt className="mr-2 text-indigo-500" />
                                            {formatDate(selectedWarranty.createdAt)}
                                        </p>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md">
                                        <p className="text-sm font-medium text-gray-500 mb-1">Cập nhật lần cuối</p>
                                        <p className="font-medium text-gray-900 flex items-center">
                                            <FaCalendarAlt className="mr-2 text-indigo-500" />
                                            {formatDate(selectedWarranty.updatedAt)}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md">
                                    <p className="text-sm font-medium text-gray-500 mb-2">Mô tả vấn đề</p>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-gray-700">
                                        {selectedWarranty.description}
                                    </div>
                                </div>

                                <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md">
                                    <p className="text-sm font-medium text-gray-500 mb-2">Thông tin liên hệ</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <span className="text-gray-500 text-sm">Họ tên:</span>
                                            <span className="font-medium text-gray-900 ml-1">{selectedWarranty.contactName}</span>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <span className="text-gray-500 text-sm">Điện thoại:</span>
                                            <span className="font-medium text-gray-900 ml-1">{selectedWarranty.contactPhone}</span>
                                        </div>
                                        <div className="sm:col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <span className="text-gray-500 text-sm">Địa chỉ:</span>
                                            <span className="font-medium text-gray-900 ml-1">{selectedWarranty.contactAddress}</span>
                                        </div>
                                    </div>
                                </div>

                                {selectedWarranty.images && selectedWarranty.images.length > 0 && (
                                    <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md">
                                        <p className="text-sm font-medium text-gray-500 mb-2">Hình ảnh</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {selectedWarranty.images.map((image, index) => (
                                                <a
                                                    key={index}
                                                    href={image}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block overflow-hidden rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                                                >
                                                    <img src={image} alt={`Ảnh ${index + 1}`} className="w-full h-28 object-cover" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedWarranty.notes && selectedWarranty.notes.length > 0 && (
                                    <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md">
                                        <p className="text-sm font-medium text-gray-500 mb-2">Ghi chú</p>
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                                            <ul className="text-sm text-gray-900 space-y-2">
                                                {selectedWarranty.notes.map((note, index) => (
                                                    <li key={index} className="flex">
                                                        <FaInfoCircle className="text-indigo-500 mr-2 mt-1 flex-shrink-0" />
                                                        <span>{note}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-end">
                            <button
                                type="button"
                                className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-105"
                                onClick={closeDetailModal}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chi tiết các trường của warranty claim trong modal */}
            {selectedWarranty && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="col-span-2">
                        <h3 className="text-sm font-semibold text-gray-500 mb-1">Mã yêu cầu</h3>
                        <p className="text-base font-semibold text-gray-800">
                            {selectedWarranty.claimNumber || `#${selectedWarranty._id.substring(0, 8)}`}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 mb-1">Mã đơn hàng</h3>
                        <p className="text-base text-gray-800">
                            {selectedWarranty.orderNumber || `#${selectedWarranty.orderId.substring(0, 8)}`}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 mb-1">Số serial</h3>
                        <p className="text-base text-gray-800">
                            {selectedWarranty.serialNumber || 'Không có thông tin'}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 mb-1">Ngày tạo</h3>
                        <p className="text-base text-gray-800">
                            {formatDate(selectedWarranty.createdAt)}
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 mb-1">Hạn bảo hành</h3>
                        <p className="text-base text-gray-800">
                            {selectedWarranty.warrantyEndDate ? formatDate(selectedWarranty.warrantyEndDate) : 'Không có thông tin'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarrantyHistoryPage; 