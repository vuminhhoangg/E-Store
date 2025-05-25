import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { warrantyAPI } from '../services/warranty';
import { FaTools, FaSpinner, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaFileAlt, FaPlus, FaHistory, FaCalendarAlt, FaInfoCircle, FaAngleRight, FaShieldAlt, FaChevronLeft, FaChevronRight, FaTruck, FaBoxOpen } from 'react-icons/fa';
import { orderAPI } from '../services/orders';
import { toast } from 'react-toastify';

interface WarrantyItem {
    _id: string;
    productId: string | {
        _id: string;
        name: string;
    };
    customerId: string | {
        _id: string;
        name: string;
        userName: string;
        phone?: string;
    };
    orderId?: string | {
        _id: string;
        orderNumber?: string;
        shippingAddress?: {
            fullName: string;
            address: string;
            city: string;
            district: string;
            ward: string;
            phone: string;
        }
    };
    orderItemId?: string;
    productName?: string;
    description: string;
    status: string;
    images?: string[];
    createdAt: string;
    updatedAt: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    contactAddress?: string;
    serialNumber?: string;
    notes?: string[];
    claimNumber?: string;
    orderNumber?: string;
    warrantyEndDate?: string;
    endDate?: string;
    responseMessage?: string;
    statusHistory?: { status: string; createdAt: string }[];
    price?: number;
    method?: string;
}

const WarrantyHistoryPage: React.FC = () => {
    const [warrantyHistory, setWarrantyHistory] = useState<WarrantyItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>('all');
    const [selectedWarranty, setSelectedWarranty] = useState<WarrantyItem | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isShippingModalOpen, setIsShippingModalOpen] = useState<boolean>(false);
    const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>('');
    const [processingShipping, setProcessingShipping] = useState<boolean>(false);

    // Phân trang
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage] = useState<number>(10);

    useEffect(() => {
        const fetchWarrantyClaims = async () => {
            try {
                setIsLoading(true);
                setError('');
                console.log('Đang tải dữ liệu yêu cầu bảo hành...');

                const response = await orderAPI.getUserWarrantyClaims();
                console.log('Dữ liệu yêu cầu bảo hành từ API:', response);

                if (response.data && response.data.length > 0) {
                    console.log('Chi tiết yêu cầu đầu tiên:', {
                        id: response.data[0]._id,
                        productName: response.data[0].productName,
                        productId: response.data[0].productId,
                        description: response.data[0].description,
                        status: response.data[0].status,
                        endDate: response.data[0].endDate,
                        warrantyEndDate: response.data[0].warrantyEndDate
                    });
                }

                if (response.success && response.data) {
                    console.log(`Đã tải ${response.data.length} yêu cầu bảo hành`);

                    // Lọc bỏ các yêu cầu có trạng thái 'pending' và đã hết hạn bảo hành
                    const filteredWarranties = response.data.filter(
                        (warranty) => warranty.status.toLowerCase() !== 'pending'
                    );

                    console.log(`Sau khi lọc trạng thái 'pending': ${filteredWarranties.length} yêu cầu`);
                    setWarrantyHistory(filteredWarranties);
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
                return 'bg-gray-100 text-gray-800 border-gray-200'; // Chờ xử lý
            case 'request':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Đang yêu cầu
            case 'approved':
                return 'bg-blue-100 text-blue-800 border-blue-200'; // Đã duyệt
            case 'sending':
                return 'bg-purple-100 text-purple-800 border-purple-200'; // Đang gửi đi
            case 'received':
                return 'bg-teal-100 text-teal-800 border-teal-200'; // Đã nhận
            case 'processing':
                return 'bg-cyan-100 text-cyan-800 border-cyan-200'; // Đang xử lý
            case 'completed':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200'; // Hoàn thành
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-200'; // Từ chối
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusGradient = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'from-gray-500 to-gray-600'; // Chờ xử lý
            case 'request':
                return 'from-yellow-500 to-amber-600'; // Đang yêu cầu
            case 'approved':
                return 'from-blue-500 to-indigo-600'; // Đã duyệt
            case 'sending':
                return 'from-purple-500 to-indigo-600'; // Đang gửi đi
            case 'received':
                return 'from-teal-500 to-green-600'; // Đã nhận
            case 'processing':
                return 'from-cyan-500 to-blue-600'; // Đang xử lý
            case 'completed':
                return 'from-emerald-500 to-teal-600'; // Hoàn thành
            case 'rejected':
                return 'from-red-500 to-rose-600'; // Từ chối
            default:
                return 'from-gray-500 to-gray-600';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return <FaSpinner className="inline-block mr-1 animate-spin" />;
            case 'request':
                return <FaFileAlt className="inline-block mr-1" />;
            case 'approved':
                return <FaCheckCircle className="inline-block mr-1" />;
            case 'sending':
                return <FaTruck className="inline-block mr-1" />;
            case 'received':
                return <FaShieldAlt className="inline-block mr-1" />;
            case 'processing':
                return <FaTools className="inline-block mr-1" />;
            case 'completed':
                return <FaCheckCircle className="inline-block mr-1" />;
            case 'rejected':
                return <FaTimesCircle className="inline-block mr-1" />;
            default:
                return <FaExclamationTriangle className="inline-block mr-1" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'Chờ xử lý';
            case 'request':
                return 'Đang yêu cầu';
            case 'approved':
                return 'Đã chấp nhận';
            case 'sending':
                return 'Đang gửi đi';
            case 'received':
                return 'Đã nhận';
            case 'processing':
                return 'Đang xử lý';
            case 'completed':
                return 'Hoàn thành';
            case 'rejected':
                return 'Từ chối';
            default:
                return status;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    };

    // Tìm thời điểm chính xác của yêu cầu bảo hành (khi chuyển thành trạng thái 'request')
    const findRequestDate = (warranty: WarrantyItem): string => {
        if (!warranty || !warranty.statusHistory || warranty.statusHistory.length === 0) {
            return warranty?.createdAt || '';
        }

        // Tìm trong lịch sử trạng thái, bản ghi đầu tiên có status là 'request'
        const requestStatusEntry = warranty.statusHistory.find(entry => entry.status === 'request');

        // Nếu tìm thấy, trả về thời điểm của bản ghi đó, nếu không thì trả về thời điểm tạo mặc định
        return requestStatusEntry ? requestStatusEntry.createdAt : warranty.createdAt;
    };

    // Lấy tên sản phẩm từ bản ghi bảo hành
    const getProductName = (warranty: WarrantyItem): string => {
        // Nếu có trường productName thì dùng
        if (warranty.productName) return warranty.productName;

        // Nếu không có, kiểm tra productId có phải là object không
        if (warranty.productId && typeof warranty.productId !== 'string' && warranty.productId.name) {
            return warranty.productId.name;
        }

        return 'Không có thông tin sản phẩm';
    };

    // Kiểm tra xem bảo hành có hết hạn chưa
    const isWarrantyExpired = (warranty: WarrantyItem): boolean => {
        // Kiểm tra trường endDate (từ backend) hoặc warrantyEndDate (tương thích với interface)
        const endDateStr = warranty.endDate || warranty.warrantyEndDate;
        if (!endDateStr) return true; // Nếu không có ngày hết hạn, coi như đã hết hạn

        const endDate = new Date(endDateStr);
        return endDate < new Date();
    };

    const filteredWarranties = warrantyHistory.filter(warranty => {
        // Luôn loại bỏ trạng thái 'pending'
        if (warranty.status.toLowerCase() === 'pending') return false;

        // Loại bỏ các yêu cầu đã hết hạn bảo hành
        if (isWarrantyExpired(warranty)) return false;

        // Nếu đang xem tất cả
        if (activeTab === 'all') return true;

        // Lọc theo tab
        return warranty.status.toLowerCase() === activeTab;
    });

    // Tính toán số trang
    const totalPages = Math.ceil(filteredWarranties.length / itemsPerPage);

    // Lấy các phần tử cho trang hiện tại
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredWarranties.slice(indexOfFirstItem, indexOfLastItem);

    // Chuyển trang
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    // Reset về trang 1 khi chuyển tab
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    const openDetailModal = (warranty: WarrantyItem) => {
        console.log('Chi tiết yêu cầu bảo hành:', warranty);
        console.log('Thông tin liên hệ:', {
            contactName: warranty.contactName,
            contactPhone: warranty.contactPhone,
            contactAddress: warranty.contactAddress,
            customerId: warranty.customerId
        });
        console.log('Thông tin đơn hàng:', {
            orderId: warranty.orderId,
            hasOrderId: !!warranty.orderId,
            isOrderIdString: typeof warranty.orderId === 'string',
            shippingAddress: typeof warranty.orderId !== 'string' ? warranty.orderId?.shippingAddress : 'Không có'
        });
        setSelectedWarranty(warranty);
        setIsModalOpen(true);
    };

    const closeDetailModal = () => {
        setIsModalOpen(false);
        setSelectedWarranty(null);
    };

    const openShippingModal = (warranty: WarrantyItem) => {
        setSelectedWarranty(warranty);
        setSelectedShippingMethod('');
        setIsShippingModalOpen(true);
    };

    const closeShippingModal = () => {
        setIsShippingModalOpen(false);
        setSelectedShippingMethod('');
    };

    const handleShippingMethodUpdate = async () => {
        if (!selectedWarranty || !selectedShippingMethod) {
            toast.error('Vui lòng chọn phương thức vận chuyển');
            return;
        }

        try {
            setProcessingShipping(true);

            // Sử dụng API updateWarrantyStatus và truyền thông tin phương thức vận chuyển
            const response = await orderAPI.updateWarrantyStatus(
                selectedWarranty._id,
                'sending',  // Cập nhật thành trạng thái "đang gửi đi"
                undefined,  // Không cần responseMessage
                {
                    method: selectedShippingMethod // Truyền thông tin phương thức vận chuyển
                }
            );

            if (response.success) {
                toast.success('Đã xác nhận gửi hàng thành công');
                closeShippingModal();
                // Tải lại danh sách bảo hành
                const fetchWarrantyClaims = async () => {
                    try {
                        setIsLoading(true);
                        setError('');
                        console.log('Đang tải lại dữ liệu yêu cầu bảo hành...');
                        const response = await orderAPI.getUserWarrantyClaims();

                        if (response.success && response.data) {
                            const filteredWarranties = response.data.filter(
                                (warranty) => warranty.status.toLowerCase() !== 'pending'
                            );
                            setWarrantyHistory(filteredWarranties);
                        }
                    } catch (err) {
                        console.error('Lỗi khi tải yêu cầu bảo hành:', err);
                    } finally {
                        setLoading(false);
                        setIsLoading(false);
                    }
                };
                fetchWarrantyClaims();
            } else {
                toast.error(response.message || 'Không thể cập nhật trạng thái gửi hàng');
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái gửi hàng:', error);
            toast.error('Đã xảy ra lỗi khi xác nhận gửi hàng');
        } finally {
            setProcessingShipping(false);
        }
    };

    // Thêm hàm để hiển thị tên phương thức vận chuyển thân thiện với người dùng
    const getShippingMethodName = (method?: string): string => {
        if (!method) return 'Không có thông tin';

        switch (method.toLowerCase()) {
            case 'self':
                return 'Tự mang đến cửa hàng';
            case 'courier':
                return 'Gửi qua dịch vụ chuyển phát';
            default:
                return method;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-blue-50 to-purple-100 py-12 px-4 sm:px-6 lg:px-8 animate-gradient-x">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-3 transform transition-all duration-500 animate-fade-in-down">Quản Lý Yêu Cầu Bảo Hành</h1>
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
                            onClick={() => setActiveTab('request')}
                            className={`flex-1 rounded-lg py-3 px-5 font-medium text-sm transition-all duration-300 ${activeTab === 'request'
                                ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-md transform scale-105'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-amber-500'
                                }`}
                        >
                            <span className="flex items-center justify-center">
                                <FaSpinner className={`mr-2 ${activeTab === 'request' ? 'animate-spin' : ''}`} />
                                Đang yêu cầu
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('approved')}
                            className={`flex-1 rounded-lg py-3 px-5 font-medium text-sm transition-all duration-300 ${activeTab === 'approved'
                                ? 'bg-gradient-to-r from-blue-400 to-indigo-500 text-white shadow-md transform scale-105'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-blue-500'
                                }`}
                        >
                            <span className="flex items-center justify-center">
                                <FaCheckCircle className={`mr-2 ${activeTab === 'approved' ? 'animate-pulse' : ''}`} />
                                Đã chấp nhận
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('sending')}
                            className={`flex-1 rounded-lg py-3 px-5 font-medium text-sm transition-all duration-300 ${activeTab === 'sending'
                                ? 'bg-gradient-to-r from-purple-400 to-indigo-500 text-white shadow-md transform scale-105'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-purple-500'
                                }`}
                        >
                            <span className="flex items-center justify-center">
                                <FaTruck className={`mr-2 ${activeTab === 'sending' ? 'animate-pulse' : ''}`} />
                                Đang gửi đi
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('received')}
                            className={`flex-1 rounded-lg py-3 px-5 font-medium text-sm transition-all duration-300 ${activeTab === 'received'
                                ? 'bg-gradient-to-r from-teal-400 to-green-500 text-white shadow-md transform scale-105'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-teal-500'
                                }`}
                        >
                            <span className="flex items-center justify-center">
                                <FaShieldAlt className={`mr-2 ${activeTab === 'received' ? 'animate-pulse' : ''}`} />
                                Đã nhận
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
                        <button
                            onClick={() => setActiveTab('rejected')}
                            className={`flex-1 rounded-lg py-3 px-5 font-medium text-sm transition-all duration-300 ${activeTab === 'rejected'
                                ? 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-md transform scale-105'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-red-500'
                                }`}
                        >
                            <span className="flex items-center justify-center">
                                <FaTimesCircle className={`mr-2 ${activeTab === 'rejected' ? 'animate-pulse' : ''}`} />
                                Từ chối
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
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in-up">
                            {currentItems.map((warranty, index) => (
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
                                                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                        {getProductName(warranty)}
                                                    </h3>
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                                    {warranty.description || 'Không có mô tả'}
                                                </p>
                                                <div className="flex flex-wrap gap-3 items-center text-xs text-gray-500">
                                                    {findRequestDate(warranty) && (
                                                        <span className="flex items-center">
                                                            <FaCalendarAlt className="mr-1 text-indigo-500" />
                                                            {formatDate(findRequestDate(warranty))}
                                                        </span>
                                                    )}
                                                    {(warranty.endDate || warranty.warrantyEndDate) && (
                                                        <span className="flex items-center">
                                                            <FaShieldAlt className="mr-1 text-teal-500" />
                                                            Hết hạn: {formatDate(warranty.endDate || warranty.warrantyEndDate)}
                                                        </span>
                                                    )}
                                                    <span className={`px-3 py-1 rounded-full border ${getStatusColor(warranty.status)} flex items-center`}>
                                                        {getStatusText(warranty.status)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="md:ml-4 flex items-end justify-end mt-4 md:mt-0">
                                                {warranty.status === 'approved' && (
                                                    <button
                                                        className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center mr-2 text-sm font-medium"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openShippingModal(warranty);
                                                        }}
                                                    >
                                                        <FaTruck className="mr-1" />
                                                        Gửi đi
                                                    </button>
                                                )}
                                                <div className="rounded-full bg-indigo-50 p-2 text-indigo-600 hover:bg-indigo-100 transition-colors duration-200">
                                                    <FaAngleRight className="h-5 w-5" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Phân trang */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex justify-center">
                                <nav className="flex items-center bg-white px-4 py-3 rounded-lg shadow-md">
                                    <button
                                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                        className={`mr-2 p-2 rounded-full ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50'}`}
                                    >
                                        <FaChevronLeft className="h-5 w-5" />
                                    </button>

                                    <div className="flex space-x-1">
                                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                                            // Logic hiển thị số trang quanh trang hiện tại
                                            let pageNumber = i + 1;
                                            if (totalPages > 5) {
                                                if (currentPage <= 3) {
                                                    pageNumber = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNumber = totalPages - 4 + i;
                                                } else {
                                                    pageNumber = currentPage - 2 + i;
                                                }
                                            }

                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => paginate(pageNumber)}
                                                    className={`w-10 h-10 rounded-full ${currentPage === pageNumber
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'text-gray-700 hover:bg-indigo-50'} font-medium transition-colors duration-200`}
                                                >
                                                    {pageNumber}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                        className={`ml-2 p-2 rounded-full ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50'}`}
                                    >
                                        <FaChevronRight className="h-5 w-5" />
                                    </button>
                                </nav>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal chi tiết yêu cầu bảo hành */}
            {isModalOpen && selectedWarranty && (
                <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
                    <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={closeDetailModal}>
                        <div className="absolute inset-0 bg-gray-900 opacity-75 backdrop-blur-sm"></div>
                    </div>

                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto overflow-hidden transform transition-all duration-300 animate-modal-in max-h-[90vh] flex flex-col">
                        <div className="absolute right-4 top-4 z-10">
                            <button
                                onClick={closeDetailModal}
                                className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors duration-300 focus:outline-none hover:rotate-90 transform transition-transform"
                            >
                                <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className={`h-3 bg-gradient-to-r ${getStatusGradient(selectedWarranty.status)}`}></div>

                        <div className="p-6 overflow-y-auto flex-grow">
                            <div className="flex items-center mb-6">
                                <div className={`flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br ${getStatusGradient(selectedWarranty.status)} flex items-center justify-center mr-4 shadow-lg animate-pulse-slow`}>
                                    <div className="text-white text-2xl">
                                        {getStatusIcon(selectedWarranty.status)}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                                        Chi tiết yêu cầu bảo hành
                                    </h3>
                                    <div className="mt-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedWarranty.status)}`}>
                                            {getStatusIcon(selectedWarranty.status)}
                                            <span className="ml-1">{getStatusText(selectedWarranty.status)}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin sản phẩm và trạng thái */}
                            <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 shadow-sm mb-6">
                                <h4 className="text-lg font-semibold text-indigo-700 mb-4 flex items-center">
                                    <FaShieldAlt className="mr-2" />
                                    Thông tin sản phẩm
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 transform transition-all duration-300 hover:shadow-md hover:border-indigo-300">
                                        <p className="text-xs font-medium text-indigo-500 uppercase tracking-wider mb-1">Sản phẩm</p>
                                        <p className="font-semibold text-gray-900 text-lg">{getProductName(selectedWarranty)}</p>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 transform transition-all duration-300 hover:shadow-md hover:border-indigo-300">
                                        <p className="text-xs font-medium text-indigo-500 uppercase tracking-wider mb-1">ID Sản phẩm</p>
                                        <p className="font-medium text-indigo-600 font-mono">
                                            {typeof selectedWarranty.productId === 'string'
                                                ? selectedWarranty.productId
                                                : selectedWarranty.productId?._id || 'Không có thông tin'}
                                        </p>
                                    </div>

                                    {findRequestDate(selectedWarranty) && (
                                        <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 transform transition-all duration-300 hover:shadow-md hover:border-indigo-300">
                                            <p className="text-xs font-medium text-indigo-500 uppercase tracking-wider mb-1">Ngày tạo yêu cầu</p>
                                            <p className="font-medium text-gray-900 flex items-center">
                                                <FaCalendarAlt className="mr-2 text-indigo-500" />
                                                {formatDate(findRequestDate(selectedWarranty))}
                                            </p>
                                        </div>
                                    )}

                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-indigo-100 transform transition-all duration-300 hover:shadow-md hover:border-indigo-300">
                                        <p className="text-xs font-medium text-indigo-500 uppercase tracking-wider mb-1">Hạn bảo hành</p>
                                        <p className="font-medium text-gray-900 flex items-center">
                                            <FaCalendarAlt className="mr-2 text-indigo-500" />
                                            {(selectedWarranty.endDate || selectedWarranty.warrantyEndDate)
                                                ? formatDate(selectedWarranty.endDate || selectedWarranty.warrantyEndDate)
                                                : 'Không có thông tin'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin chi tiết */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Mô tả vấn đề và hình ảnh - Chiếm 2/3 */}
                                <div className="lg:col-span-2 flex flex-col gap-6">
                                    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200 transform transition-all duration-300 hover:shadow-lg">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                            <FaExclamationTriangle className="text-amber-500 mr-2" />
                                            Mô tả vấn đề
                                        </h4>
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-700">
                                            {selectedWarranty.description}
                                        </div>

                                        {selectedWarranty.images && selectedWarranty.images.length > 0 && (
                                            <div className="mt-5">
                                                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                                    <FaFileAlt className="text-indigo-500 mr-2" />
                                                    Hình ảnh
                                                </h4>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {selectedWarranty.images.map((image, index) => (
                                                        <a
                                                            key={index}
                                                            href={image}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="overflow-hidden rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-105 bg-gray-100"
                                                        >
                                                            <img src={image} alt={`Ảnh ${index + 1}`} className="w-full h-24 object-cover" />
                                                        </a>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Thông tin sửa chữa - Section mới */}
                                    {(selectedWarranty.status === 'approved' ||
                                        selectedWarranty.status === 'sending' ||
                                        selectedWarranty.status === 'received' ||
                                        selectedWarranty.status === 'processing' ||
                                        selectedWarranty.status === 'completed') && (
                                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-xl shadow-md border border-emerald-200 transform transition-all duration-300 hover:shadow-lg">
                                                <h4 className="text-lg font-semibold text-emerald-700 mb-3 flex items-center">
                                                    <FaTools className="mr-2" />
                                                    Thông tin sửa chữa
                                                </h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100">
                                                        <span className="block text-sm font-medium text-emerald-600 mb-1">Giá sửa chữa:</span>
                                                        <p className="text-xl font-bold text-gray-900">
                                                            {selectedWarranty.price !== undefined && selectedWarranty.price > 0
                                                                ? new Intl.NumberFormat('vi-VN', {
                                                                    style: 'currency',
                                                                    currency: 'VND'
                                                                }).format(selectedWarranty.price)
                                                                : (selectedWarranty.price === 0 ? 'Miễn phí' : 'Chưa cập nhật')}
                                                        </p>
                                                    </div>
                                                    {selectedWarranty.responseMessage && (
                                                        <div className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100">
                                                            <span className="block text-sm font-medium text-emerald-600 mb-1">Thông báo:</span>
                                                            <p className="font-medium text-gray-800">
                                                                {selectedWarranty.responseMessage}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {selectedWarranty.status !== 'approved' && selectedWarranty.method && (<div className="bg-white p-4 rounded-lg shadow-sm border border-emerald-100">                                                            <span className="block text-sm font-medium text-emerald-600 mb-1">Phương thức vận chuyển:</span>                                                            <p className="font-medium text-gray-800 flex items-center">                                                                {selectedWarranty.method === 'self' ? <FaBoxOpen className="mr-2 text-indigo-500" /> : <FaTruck className="mr-2 text-indigo-500" />}                                                                {getShippingMethodName(selectedWarranty.method)}                                                            </p>                                                        </div>)}
                                                </div>
                                            </div>
                                        )}

                                    {/* Thông tin từ chối bảo hành */}
                                    {selectedWarranty.status === 'rejected' && selectedWarranty.responseMessage && (
                                        <div className="bg-gradient-to-r from-red-50 to-rose-50 p-5 rounded-xl shadow-md border border-red-200 transform transition-all duration-300 hover:shadow-lg">
                                            <h4 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
                                                <FaTimesCircle className="mr-2" />
                                                Lý do từ chối bảo hành
                                            </h4>
                                            <div className="bg-white p-4 rounded-lg shadow-sm border border-red-100">
                                                <p className="font-medium text-gray-800">
                                                    {selectedWarranty.responseMessage}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Thông tin liên hệ - Chiếm 1/3 */}
                                <div className="flex flex-col gap-6">
                                    <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200 transform transition-all duration-300 hover:shadow-lg">
                                        <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                            <svg className="w-5 h-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Thông tin liên hệ
                                        </h4>

                                        <div className="space-y-4">
                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                <label className="block text-xs font-medium text-blue-600 mb-1">
                                                    Tên liên hệ
                                                </label>
                                                <p className="font-medium text-gray-800">
                                                    {selectedWarranty.contactName ||
                                                        (typeof selectedWarranty.orderId !== 'string' &&
                                                            selectedWarranty.orderId?.shippingAddress?.fullName) ||
                                                        (typeof selectedWarranty.customerId !== 'string' &&
                                                            selectedWarranty.customerId?.userName) ||
                                                        (typeof selectedWarranty.customerId !== 'string' &&
                                                            selectedWarranty.customerId?.name) ||
                                                        'Không có thông tin'}
                                                </p>
                                            </div>

                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                <label className="block text-xs font-medium text-blue-600 mb-1">
                                                    Số điện thoại
                                                </label>
                                                <p className="font-medium text-gray-800">
                                                    {selectedWarranty.contactPhone ||
                                                        (typeof selectedWarranty.orderId !== 'string' &&
                                                            selectedWarranty.orderId?.shippingAddress?.phone) ||
                                                        (typeof selectedWarranty.customerId !== 'string' &&
                                                            selectedWarranty.customerId?.phone) ||
                                                        'Không có thông tin'}
                                                </p>
                                            </div>

                                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                <label className="block text-xs font-medium text-blue-600 mb-1">
                                                    Địa chỉ
                                                </label>
                                                <p className="font-medium text-gray-800">
                                                    {selectedWarranty.contactAddress ||
                                                        (typeof selectedWarranty.orderId !== 'string' &&
                                                            selectedWarranty.orderId?.shippingAddress ?
                                                            `${selectedWarranty.orderId.shippingAddress.address}` : '') ||
                                                        'Không có thông tin'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {selectedWarranty.notes && selectedWarranty.notes.length > 0 && (
                                        <div className="bg-white p-5 rounded-xl shadow-md border border-gray-200 transform transition-all duration-300 hover:shadow-lg">
                                            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                                <FaInfoCircle className="text-indigo-500 mr-2" />
                                                Ghi chú
                                            </h4>
                                            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                                                <ul className="text-sm text-gray-800 space-y-2">
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
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-end flex-shrink-0 border-t border-gray-200">
                            {selectedWarranty.status === 'approved' && (
                                <button
                                    type="button"
                                    className="mr-2 inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        closeDetailModal();
                                        openShippingModal(selectedWarranty);
                                    }}
                                >
                                    <FaTruck className="mr-2" />
                                    Gửi đi
                                </button>
                            )}
                            <button
                                type="button"
                                className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300 transform hover:scale-105"
                                onClick={closeDetailModal}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal chọn phương thức vận chuyển */}
            {isShippingModalOpen && selectedWarranty && (
                <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center">
                    <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={closeShippingModal}>
                        <div className="absolute inset-0 bg-gray-900 opacity-75 backdrop-blur-sm"></div>
                    </div>

                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden transform transition-all duration-300 animate-modal-in">
                        <div className="absolute right-4 top-4 z-10">
                            <button
                                onClick={closeShippingModal}
                                className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors duration-300 focus:outline-none hover:rotate-90 transform transition-transform"
                            >
                                <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="h-3 bg-gradient-to-r from-indigo-500 to-blue-600"></div>

                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <FaTruck className="text-indigo-600 mr-2" />
                                Chọn phương thức gửi sản phẩm
                            </h2>

                            <p className="text-gray-600 mb-6">
                                Vui lòng chọn phương thức bạn sẽ sử dụng để gửi sản phẩm đến cửa hàng của chúng tôi.
                            </p>

                            <div className="space-y-4">
                                <div
                                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 flex items-center ${selectedShippingMethod === 'self' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'}`}
                                    onClick={() => setSelectedShippingMethod('self')}
                                >
                                    <div className="bg-indigo-100 p-3 rounded-full mr-3">
                                        <FaBoxOpen className="text-indigo-600 text-lg" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Tự mang đến cửa hàng</h3>
                                        <p className="text-sm text-gray-500">Bạn sẽ tự mang sản phẩm đến địa chỉ cửa hàng của chúng tôi</p>
                                    </div>
                                    <div className="ml-auto">
                                        <div className={`w-5 h-5 rounded-full border-2 ${selectedShippingMethod === 'self' ? 'border-indigo-600' : 'border-gray-300'} flex items-center justify-center`}>
                                            {selectedShippingMethod === 'self' && <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className={`p-4 border rounded-xl cursor-pointer transition-all duration-200 flex items-center ${selectedShippingMethod === 'courier' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'}`}
                                    onClick={() => setSelectedShippingMethod('courier')}
                                >
                                    <div className="bg-indigo-100 p-3 rounded-full mr-3">
                                        <FaTruck className="text-indigo-600 text-lg" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Gửi qua dịch vụ chuyển phát</h3>
                                        <p className="text-sm text-gray-500">Sử dụng dịch vụ chuyển phát nhanh để gửi đến cửa hàng</p>
                                    </div>
                                    <div className="ml-auto">
                                        <div className={`w-5 h-5 rounded-full border-2 ${selectedShippingMethod === 'courier' ? 'border-indigo-600' : 'border-gray-300'} flex items-center justify-center`}>
                                            {selectedShippingMethod === 'courier' && <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
                            <button
                                type="button"
                                className="mr-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                onClick={closeShippingModal}
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 flex items-center"
                                onClick={handleShippingMethodUpdate}
                                disabled={!selectedShippingMethod || processingShipping}
                            >
                                {processingShipping ? (
                                    <>
                                        <FaSpinner className="animate-spin mr-2" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        <FaTruck className="mr-2" />
                                        Xác nhận gửi hàng
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarrantyHistoryPage; 