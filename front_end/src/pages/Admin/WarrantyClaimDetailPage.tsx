import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { orderAPI } from '../../services/orders';

interface WarrantyClaimDetail {
    _id: string;
    orderItemId: string;
    productId?: string;
    orderId: string | {
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
    productName: string;
    productImage: string;
    serialNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    description: string;
    status: string;
    statusHistory: {
        status: string;
        notes: string;
        createdAt: string;
        updatedBy: string;
    }[];
    images: string[];
    createdAt: string;
    updatedAt: string;
    warrantyPeriodMonths: number;
    warrantyStartDate: string;
    warrantyEndDate: string;
    startDate?: string;
    endDate?: string;
    contactName?: string;
    contactPhone?: string;
    contactAddress?: string;
    price?: number;
    responseMessage?: string;
    method?: string;
}

const WarrantyClaimDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [claim, setClaim] = useState<WarrantyClaimDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [statusUpdate, setStatusUpdate] = useState<string>('');
    const [previousStatus, setPreviousStatus] = useState<string>('');
    const [processing, setProcessing] = useState<boolean>(false);
    const [price, setPrice] = useState<number>(0);
    const [initialPrice, setInitialPrice] = useState<number>(0);
    const [responseMessage, setResponseMessage] = useState<string>('');
    const [initialResponseMessage, setInitialResponseMessage] = useState<string>('');

    useEffect(() => {
        fetchWarrantyClaim();
    }, [id]);

    // Đảm bảo không thể chọn trạng thái pending
    useEffect(() => {
        if (statusUpdate === 'pending') {
            // Nếu người dùng cố gắng chọn pending, reset về trạng thái trước đó
            setStatusUpdate(previousStatus || 'request');
        }
    }, [statusUpdate, previousStatus]);

    const fetchWarrantyClaim = async () => {
        if (!id) {
            setError('Không tìm thấy ID yêu cầu bảo hành');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            console.log('[WarrantyClaimDetailPage] Đang fetch dữ liệu bảo hành ID:', id);
            const response = await orderAPI.getWarrantyClaimById(id);

            // Xác định nguồn dữ liệu
            let claimData;
            if (response && response.data) {
                // Nếu response.data đã có dữ liệu
                if (response.data._id) {
                    // Trường hợp response.data là dữ liệu trực tiếp
                    claimData = response.data;
                } else if (response.data.data && response.data.data._id) {
                    // Trường hợp response.data.data chứa dữ liệu
                    claimData = response.data.data;
                }
            }

            if (claimData) {
                // Debug: Log thông tin quan trọng nhất
                console.log('[WarrantyClaimDetailPage] Đã nhận dữ liệu bảo hành:', {
                    id: claimData._id,
                    status: claimData.status,
                    productName: claimData.productName
                });

                // Xử lý thông tin orderId nếu đã được populate
                const hasPopulatedOrder = claimData.orderId &&
                    typeof claimData.orderId !== 'string' &&
                    claimData.orderId._id;

                // Kiểm tra cụ thể thông tin giao hàng
                if (hasPopulatedOrder) {
                    console.log('[WarrantyClaimDetailPage] Có thông tin đơn hàng kèm theo');
                }

                // Format dữ liệu cho component
                const transformedClaim = {
                    ...claimData,
                    orderId: claimData.orderId, // Giữ nguyên đối tượng orderId đã populate
                    customerName: claimData.contactName || claimData.customerName,
                    customerPhone: claimData.contactPhone || claimData.customerPhone,
                    customerEmail: claimData.contactEmail || claimData.customerEmail,
                    productImage: claimData.productImage || (claimData.productId && claimData.productId.image) || '',
                    // Đảm bảo các trường bảo hành có giá trị
                    warrantyStartDate: claimData.warrantyStartDate || claimData.startDate || '',
                    warrantyEndDate: claimData.warrantyEndDate || claimData.endDate || '',
                    warrantyPeriodMonths: claimData.warrantyPeriodMonths || (claimData.productId && claimData.productId.warrantyPeriodMonths) || 0,
                    // Dùng ID của sản phẩm làm mã sản phẩm
                    productId: typeof claimData.productId === 'string' ? claimData.productId : (claimData.productId?._id || ''),
                    // Thêm price, responseMessage và method
                    price: claimData.price || 0,
                    responseMessage: claimData.responseMessage || '',
                    method: claimData.method || ''
                };

                console.log('[WarrantyClaimDetailPage] Dữ liệu sau khi transform:', {
                    id: transformedClaim._id,
                    productName: transformedClaim.productName,
                    status: transformedClaim.status,
                    warrantyPeriodMonths: transformedClaim.warrantyPeriodMonths,
                    productId: transformedClaim.productId,
                    statusHistory: transformedClaim.statusHistory?.length || 0
                });

                // Debug: Log thông tin chi tiết từ productId nếu có
                if (claimData.productId && typeof claimData.productId !== 'string') {
                    console.log('[WarrantyClaimDetailPage] Chi tiết thông tin sản phẩm:', {
                        id: claimData.productId._id,
                        name: claimData.productId.name,
                        warrantyPeriodMonths: claimData.productId.warrantyPeriodMonths || 'không có',
                        serialNumber: claimData.productId.serialNumber || 'không có'
                    });
                }

                // Kết thúc quá trình transform dữ liệu
                setClaim(transformedClaim);
                // Cập nhật trạng thái hiện tại trong form
                setStatusUpdate(transformedClaim.status);
                setPreviousStatus(transformedClaim.status);
                // Cập nhật giá và responseMessage và lưu giá trị ban đầu
                setPrice(transformedClaim.price || 0);
                setInitialPrice(transformedClaim.price || 0);
                setResponseMessage(transformedClaim.responseMessage || '');
                setInitialResponseMessage(transformedClaim.responseMessage || '');
            } else {
                console.error('[WarrantyClaimDetailPage] Không tìm thấy dữ liệu bảo hành');
                setError('Không tìm thấy thông tin yêu cầu bảo hành hoặc dữ liệu không đúng định dạng');
                toast.error('Không thể tải thông tin yêu cầu bảo hành');
            }
        } catch (error) {
            console.error('[WarrantyClaimDetailPage] Lỗi khi tải thông tin yêu cầu bảo hành:', error);

            let errorMessage = 'Đã xảy ra lỗi khi tải thông tin yêu cầu bảo hành';
            if (error.response) {
                console.error('[WarrantyClaimDetailPage] Chi tiết lỗi response:', {
                    status: error.response.status,
                    data: error.response.data
                });

                // Nếu có message cụ thể từ server
                if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            }

            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            // Giảm độ trễ để người dùng không bị load quá nhanh làm hoang mang
            setTimeout(() => {
                setLoading(false);
            }, 300);
        }
    };

    const handleUpdateStatus = async () => {
        if (!id || !statusUpdate) return;

        // Kiểm tra nếu trạng thái không thể thay đổi
        if (!canChangeStatus(claim.status)) {
            toast.info(`Không thể thay đổi trạng thái của yêu cầu ở trạng thái ${getStatusDisplayName(claim.status)}`);
            return;
        }

        try {
            setProcessing(true);
            console.log('[WarrantyClaimDetailPage] Đang cập nhật trạng thái:', {
                từ: previousStatus,
                thành: statusUpdate,
                ghi_chú: statusUpdate !== 'request' ? responseMessage : undefined,
                price: statusUpdate !== 'rejected' && statusUpdate !== 'request' ? price : undefined,
                responseMessage: statusUpdate !== 'request' ? responseMessage : undefined
            });

            let additionalData = undefined;

            // Với trạng thái "yêu cầu mới", không gửi thêm dữ liệu gì cả
            if (statusUpdate === 'request') {
                additionalData = undefined;
            }
            // Với trạng thái "từ chối bảo hành", chỉ gửi responseMessage
            else if (statusUpdate === 'rejected') {
                additionalData = { responseMessage };
            }
            // Với trạng thái "sending", gửi cả method (nếu có), price và responseMessage
            else if (statusUpdate === 'sending') {
                additionalData = {
                    price: price !== undefined ? price : 0,
                    responseMessage,
                    method: claim.method || '' // Truyền method nếu có
                };
            }
            // Với trạng thái "approved" và các trạng thái khác sau đó, gửi cả price và responseMessage
            else if (statusUpdate === 'approved' ||
                statusUpdate === 'received' ||
                statusUpdate === 'processing' ||
                statusUpdate === 'completed') {
                additionalData = {
                    price: price !== undefined ? price : 0,
                    responseMessage
                };
            }

            const response = await orderAPI.updateWarrantyStatus(
                id,
                statusUpdate,
                statusUpdate !== 'request' ? responseMessage : undefined,
                additionalData
            );

            // Kiểm tra thành công giống như ở WarrantyManagementPage
            const isSuccess = response.success === true ||
                response.data?.success === true ||
                (response.data && response.data._id);

            if (isSuccess) {
                toast.success('Cập nhật trạng thái bảo hành thành công');
                console.log('[WarrantyClaimDetailPage] Cập nhật thành công -> làm mới dữ liệu');
                // Thiết lập các state cần thiết
                setResponseMessage('');
                setPreviousStatus(statusUpdate);
                // Chờ một chút trước khi fetch lại dữ liệu để đảm bảo backend đã xử lý xong
                setTimeout(() => {
                    fetchWarrantyClaim();
                }, 500);
            } else {
                const errorMessage = response.message ||
                    response.data?.message ||
                    'Lỗi khi cập nhật trạng thái';
                console.error('[WarrantyClaimDetailPage] Lỗi cập nhật:', errorMessage);
                toast.error(errorMessage);
            }
        } catch (error) {
            console.error('[WarrantyClaimDetailPage] Lỗi khi cập nhật trạng thái bảo hành:', error);

            let errorMessage = 'Đã xảy ra lỗi khi cập nhật trạng thái bảo hành';

            // Hiển thị thông báo lỗi cụ thể từ API nếu có
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }

            console.error('[WarrantyClaimDetailPage] Chi tiết lỗi:', errorMessage);
            toast.error(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';

        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Tìm thời điểm chính xác của yêu cầu bảo hành (khi chuyển thành trạng thái 'request')
    const findRequestDate = () => {
        if (!claim || !claim.statusHistory || claim.statusHistory.length === 0) {
            return claim?.createdAt || '';
        }

        // Tìm trong lịch sử trạng thái, bản ghi đầu tiên có status là 'request'
        const requestStatusEntry = claim.statusHistory.find(entry => entry.status === 'request');

        // Nếu tìm thấy, trả về thời điểm của bản ghi đó, nếu không thì trả về thời điểm tạo mặc định
        return requestStatusEntry ? requestStatusEntry.createdAt : claim.createdAt;
    };

    // Kiểm tra xem trạng thái có thể thay đổi không
    const canChangeStatus = (status: string): boolean => {
        return !['pending', 'completed', 'rejected'].includes(status);
    };

    // Lấy tên hiển thị của trạng thái
    const getStatusDisplayName = (status: string): string => {
        switch (status) {
            case 'pending': return 'Chờ xử lý';
            case 'request': return 'Yêu cầu mới';
            case 'approved': return 'Đã chấp nhận';
            case 'sending': return 'Đang gửi đi';
            case 'received': return 'Đã nhận';
            case 'processing': return 'Đang xử lý';
            case 'completed': return 'Hoàn thành';
            case 'rejected': return 'Từ chối bảo hành';
            default: return status;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
                        Chờ xử lý
                    </span>
                );
            case 'request':
                return (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Yêu cầu mới
                    </span>
                );
            case 'approved':
                return (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                        Đã chấp nhận
                    </span>
                );
            case 'sending':
                return (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        Đang gửi đi
                    </span>
                );
            case 'received':
                return (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800">
                        Đã nhận
                    </span>
                );
            case 'processing':
                return (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Đang xử lý
                    </span>
                );
            case 'completed':
                return (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Hoàn thành
                    </span>
                );
            case 'rejected':
                return (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                        Từ chối bảo hành
                    </span>
                );
            default:
                return (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                        {status}
                    </span>
                );
        }
    };

    // Kiểm tra xem có thay đổi nào không
    const hasChanges = (): boolean => {
        // Có thay đổi trạng thái
        if (statusUpdate !== previousStatus) return true;

        // Thay đổi giá tiền (chỉ với trạng thái cần giá tiền)
        if (statusUpdate !== 'rejected' && statusUpdate !== 'request' && price !== initialPrice) return true;

        // Thay đổi thông báo (chỉ với trạng thái cần thông báo)
        if (statusUpdate !== 'request' && responseMessage !== initialResponseMessage) return true;

        return false;
    };

    // Hàm để hiển thị tên phương thức vận chuyển thân thiện
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

    if (loading) {
        return (
            <div className="flex items-center justify-center p-10 h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải thông tin yêu cầu bảo hành...</p>
                </div>
            </div>
        );
    }

    if (error || !claim) {
        return (
            <div className="flex flex-col items-center justify-center p-10 h-screen bg-gray-50">
                <div className="text-center bg-white rounded-xl shadow-md p-8 max-w-md">
                    <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy</h2>
                    <p className="text-gray-600 mb-6">{error || 'Không tìm thấy thông tin yêu cầu bảo hành'}</p>
                    <button
                        onClick={() => navigate('/admin/warranty')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
            <div className="flex justify-between items-center mb-8">
                <div className="bg-white shadow-md rounded-xl p-5 border border-blue-100 transform transition-all duration-300 hover:shadow-lg">
                    <h1 className="text-2xl font-bold text-gray-800 mb-1 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Chi tiết yêu cầu bảo hành</h1>
                </div>
                <div className="flex space-x-3">
                    <Link
                        to={`/admin/orders/${claim.orderId}`}
                        className="px-4 py-2 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-colors flex items-center shadow-sm hover:shadow-md"
                    >
                        <svg className="w-5 h-5 mr-1 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        Xem đơn hàng
                    </Link>
                    <button
                        onClick={() => navigate('/admin/warranty')}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-indigo-700 bg-white hover:bg-indigo-50 transition-colors shadow-sm hover:shadow-md"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Warranty and Product Information */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100 hover:shadow-xl transition-all duration-300">
                        <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Thông tin bảo hành
                            </h2>
                            <div className="flex items-center justify-between mb-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div>
                                    <span className="text-gray-600 text-sm font-medium">Trạng thái hiện tại:</span>
                                    <div className="mt-1">{getStatusBadge(claim.status)}</div>
                                </div>
                                {findRequestDate() && (
                                    <div className="text-right">
                                        <span className="text-gray-600 text-sm font-medium">Ngày tạo yêu cầu:</span>
                                        <div className="text-gray-900 font-medium">{formatDate(findRequestDate())}</div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-gradient-to-br from-white to-blue-50 p-4 rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-all duration-300">
                                    <span className="text-gray-600 text-sm font-medium flex items-center">
                                        <svg className="w-4 h-4 mr-1 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Thời hạn bảo hành:
                                    </span>
                                    <div className="text-gray-900 font-medium mt-1">
                                        {claim.warrantyPeriodMonths ? (
                                            <span className="text-indigo-700 bg-indigo-50 px-2 py-1 rounded-full text-sm">
                                                {claim.warrantyPeriodMonths} tháng
                                            </span>
                                        ) : 'N/A'}
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-white to-blue-50 p-4 rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-all duration-300 flex flex-col">
                                    <div className="flex-1">
                                        <span className="text-gray-600 text-sm font-medium flex items-center">
                                            <svg className="w-4 h-4 mr-1 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Ngày kết thúc:
                                        </span>
                                    </div>
                                    <div className="flex-1 text-gray-900 font-medium mt-1">
                                        {claim.warrantyEndDate ? formatDate(claim.warrantyEndDate) :
                                            (claim.endDate ? formatDate(claim.endDate) : 'N/A')}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-white to-indigo-50 p-4 rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-all duration-300 mb-4">
                                <span className="text-gray-600 text-sm font-medium flex items-center mb-1">
                                    <svg className="w-4 h-4 mr-1 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    Mã sản phẩm:
                                </span>
                                <div className="text-gray-900 font-medium">
                                    <span className="font-mono text-blue-600 text-sm bg-blue-50 px-2 py-1 rounded border border-blue-200 inline-block truncate max-w-full">{claim.productId}</span>
                                </div>
                            </div>

                            {/* Thông tin bảo hành cho các trạng thái khác nhau */}
                            {(claim.status === 'approved' ||
                                claim.status === 'sending' ||
                                claim.status === 'received' ||
                                claim.status === 'processing' ||
                                claim.status === 'completed') && (
                                    <div className="bg-gradient-to-br from-white to-green-50 p-4 rounded-lg shadow-sm border border-green-100 hover:shadow-md transition-all duration-300 mb-4">
                                        <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                                            <svg className="w-5 h-5 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                            </svg>
                                            Thông tin bảo hành
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100">
                                                <span className="text-gray-600 text-xs font-medium">Giá sửa chữa:</span>
                                                <p className="font-medium text-gray-900 mt-1">
                                                    {claim.price !== undefined && claim.price > 0
                                                        ? new Intl.NumberFormat('vi-VN', {
                                                            style: 'currency',
                                                            currency: 'VND'
                                                        }).format(claim.price)
                                                        : (claim.price === 0 ? 'Miễn phí' : 'Chưa cập nhật')}
                                                </p>
                                            </div>
                                            {claim.responseMessage && (
                                                <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100">
                                                    <span className="text-gray-600 text-xs font-medium">Thông báo:</span>
                                                    <p className="font-medium text-gray-900 mt-1">
                                                        {claim.responseMessage}
                                                    </p>
                                                </div>
                                            )}
                                            {claim.status !== 'approved' && claim.method && (
                                                <div className="bg-white p-3 rounded-lg shadow-sm border border-green-100">
                                                    <span className="text-gray-600 text-xs font-medium">Phương thức vận chuyển:</span>
                                                    <p className="font-medium text-gray-900 mt-1 flex items-center">
                                                        {claim.method === 'self' ? (
                                                            <svg className="w-4 h-4 mr-1.5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4 mr-1.5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                            </svg>
                                                        )}
                                                        {getShippingMethodName(claim.method)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Thông tin từ chối bảo hành */}
                            {claim.status === 'rejected' && claim.responseMessage && (
                                <div className="bg-gradient-to-br from-white to-red-50 p-4 rounded-lg shadow-sm border border-red-100 hover:shadow-md transition-all duration-300 mb-4">
                                    <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Lý do từ chối bảo hành
                                    </h3>
                                    <div className="bg-white p-3 rounded-lg shadow-sm border border-red-100">
                                        <span className="text-gray-600 text-xs font-medium">Thông báo:</span>
                                        <p className="font-medium text-gray-900 mt-1">
                                            {claim.responseMessage}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
                                <div className="h-20 w-20 overflow-hidden rounded-lg bg-gray-100 flex-shrink-0 mr-4 border border-gray-200">
                                    <img
                                        src={claim.productImage || 'https://via.placeholder.com/150'}
                                        alt={claim.productName}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = 'https://via.placeholder.com/150';
                                        }}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">{claim.productName}</h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Problem Description */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100 hover:shadow-xl transition-all duration-300">
                        <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Mô tả vấn đề
                            </h2>
                            <div className="bg-blue-50 p-4 rounded-lg text-gray-800 mb-4 border border-blue-100 shadow-inner">
                                {claim.description}
                            </div>

                            {claim.images && claim.images.length > 0 && (
                                <div>
                                    <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                                        <svg className="w-4 h-4 mr-1 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        Hình ảnh đính kèm
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {claim.images.map((image, index) => (
                                            <a
                                                key={index}
                                                href={image}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-90 transition-opacity border border-gray-200 shadow-sm hover:shadow-md transform hover:scale-105 transition-transform"
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
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Customer Information */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100 hover:shadow-xl transition-all duration-300">
                        <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                Thông tin liên hệ
                            </h2>
                            <div className="space-y-3">
                                <div className="bg-gradient-to-br from-white to-blue-50 p-3 rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-all duration-300">
                                    <span className="text-gray-600 text-xs font-medium">Tên liên hệ:</span>
                                    <p className="font-medium text-gray-900 mt-1">
                                        {(typeof claim.orderId !== 'string' && claim.orderId?.shippingAddress?.fullName) ||
                                            claim.contactName ||
                                            claim.customerName || 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-white to-blue-50 p-3 rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-all duration-300">
                                    <span className="text-gray-600 text-xs font-medium">Số điện thoại:</span>
                                    <p className="font-medium text-gray-900 mt-1">
                                        {(typeof claim.orderId !== 'string' && claim.orderId?.shippingAddress?.phone) ||
                                            claim.contactPhone ||
                                            claim.customerPhone || 'N/A'}
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-white to-blue-50 p-3 rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-all duration-300">
                                    <span className="text-gray-600 text-xs font-medium">Địa chỉ:</span>
                                    <p className="font-medium text-gray-900 mt-1">
                                        {(typeof claim.orderId !== 'string' && claim.orderId?.shippingAddress ?
                                            `${claim.orderId.shippingAddress.address}` : '') ||
                                            claim.contactAddress ||
                                            'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Update Status */}
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-blue-100 hover:shadow-xl transition-all duration-300">
                        <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Cập nhật trạng thái
                            </h2>
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100 shadow-inner">
                                    <p className="text-sm text-gray-600 mb-2">
                                        <span className="font-medium text-gray-700">Trạng thái hiện tại:</span>
                                        <span className="ml-2 font-semibold text-blue-700">{getStatusDisplayName(claim.status)}</span>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium text-gray-700">Cập nhật lần cuối:</span>
                                        <span className="ml-2 font-medium text-gray-800">{formatDate(claim.updatedAt)}</span>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="status">
                                        Trạng thái mới:
                                    </label>
                                    <select
                                        id="status"
                                        value={statusUpdate}
                                        onChange={(e) => setStatusUpdate(e.target.value)}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm ${!canChangeStatus(claim.status) ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-blue-300'}`}
                                        disabled={!canChangeStatus(claim.status)}
                                    >
                                        <option value="pending" disabled={true}>Chờ xử lý</option>
                                        <option value="request">Yêu cầu mới</option>
                                        <option value="approved">Đã chấp nhận</option>
                                        <option value="sending" disabled={true}>Đang gửi đi (do khách hàng cập nhật)</option>
                                        <option value="received">Đã nhận</option>
                                        <option value="processing">Đang xử lý</option>
                                        <option value="completed">Hoàn thành</option>
                                        <option value="rejected">Từ chối bảo hành</option>
                                    </select>
                                </div>

                                {/* Hiển thị trường giá tiền nếu không phải trạng thái "rejected" và "request" */}
                                {statusUpdate !== 'rejected' && statusUpdate !== 'request' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="price">
                                            Giá tiền sửa chữa (VND):
                                        </label>
                                        <input
                                            id="price"
                                            type="number"
                                            value={price}
                                            onChange={(e) => setPrice(Number(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm hover:border-blue-300"
                                            placeholder="Nhập giá tiền sửa chữa"
                                            min="0"
                                        />
                                    </div>
                                )}

                                {/* Hiển thị trường thông báo cho tất cả các trạng thái trừ "request" */}
                                {statusUpdate !== 'request' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="responseMessage">
                                            {statusUpdate === 'rejected' ? 'Lý do từ chối:' : 'Thông báo cho khách hàng:'}
                                        </label>
                                        <textarea
                                            id="responseMessage"
                                            value={responseMessage}
                                            onChange={(e) => setResponseMessage(e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm hover:border-blue-300"
                                            placeholder={statusUpdate === 'rejected' ? "Nhập lý do từ chối bảo hành..." : "Nhập thông báo cho khách hàng về bảo hành..."}
                                        />
                                    </div>
                                )}

                                <div className="flex flex-col justify-end pt-2">
                                    {canChangeStatus(claim.status) ? (
                                        <button
                                            type="button"
                                            onClick={handleUpdateStatus}
                                            disabled={processing || !hasChanges()}
                                            className={`py-3 px-6 text-white font-medium rounded-lg shadow-md 
                                                ${processing || !hasChanges()
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transform hover:translate-y-[-1px] transition-all duration-200'
                                                } transition-colors flex items-center justify-center`}
                                        >
                                            {processing ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Đang xử lý...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                    {statusUpdate !== previousStatus ? 'Cập nhật trạng thái' : 'Cập nhật thông tin'}
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="py-3 px-6 text-white font-medium rounded-lg bg-gray-400 cursor-not-allowed flex items-center justify-center shadow-md"
                                            disabled
                                        >
                                            <svg className="w-5 h-5 mr-2 text-white opacity-75" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            Cập nhật trạng thái
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WarrantyClaimDetailPage; 