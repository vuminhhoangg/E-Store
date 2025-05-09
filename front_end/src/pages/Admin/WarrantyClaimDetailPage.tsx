import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { orderAPI } from '../../services/orders';

interface WarrantyClaimDetail {
    _id: string;
    orderItemId: string;
    orderId: string;
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
}

const WarrantyClaimDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [claim, setClaim] = useState<WarrantyClaimDetail | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [statusUpdate, setStatusUpdate] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [processing, setProcessing] = useState<boolean>(false);

    useEffect(() => {
        fetchWarrantyClaim();
    }, [id]);

    const fetchWarrantyClaim = async () => {
        if (!id) {
            setError('Không tìm thấy ID yêu cầu bảo hành');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await orderAPI.getWarrantyClaimById(id);

            if (response.data.success) {
                const claimData = response.data.data;
                const transformedClaim = {
                    ...claimData,
                    customerName: claimData.contactName || claimData.customerName,
                    customerPhone: claimData.contactPhone || claimData.customerPhone,
                    customerEmail: claimData.contactEmail || claimData.customerEmail,
                    productImage: claimData.productImage || (claimData.productId && claimData.productId.image) || '',
                };
                setClaim(transformedClaim);
                setStatusUpdate(claimData.status);
            } else {
                setError(response.data.message || 'Không thể tải thông tin yêu cầu bảo hành');
            }
        } catch (error) {
            console.error('Lỗi khi tải thông tin yêu cầu bảo hành:', error);
            setError('Đã xảy ra lỗi khi tải thông tin yêu cầu bảo hành');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!id || !statusUpdate) return;

        try {
            setProcessing(true);
            const response = await orderAPI.updateWarrantyStatus(id, statusUpdate, notes);

            if (response.data.success) {
                toast.success('Cập nhật trạng thái bảo hành thành công');
                // Refresh data
                fetchWarrantyClaim();
                setNotes('');
            } else {
                toast.error(response.data.message || 'Lỗi khi cập nhật trạng thái');
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái bảo hành:', error);
            toast.error('Đã xảy ra lỗi khi cập nhật trạng thái bảo hành');
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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                        Đang chờ xử lý
                    </span>
                );
            case 'under_review':
                return (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        Đang xem xét
                    </span>
                );
            case 'approved':
                return (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                        Đã chấp nhận
                    </span>
                );
            case 'in_progress':
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
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Chi tiết yêu cầu bảo hành</h1>
                    <p className="text-gray-600">
                        Mã yêu cầu: <span className="font-medium">{claim._id}</span>
                    </p>
                </div>
                <div className="flex space-x-3">
                    <Link
                        to={`/admin/orders/${claim.orderId}`}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                    >
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                        </svg>
                        Xem đơn hàng
                    </Link>
                    <button
                        onClick={() => navigate('/admin/warranty')}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Warranty and Product Information */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin bảo hành</h2>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <span className="text-gray-600">Trạng thái hiện tại:</span>
                                    <div className="mt-1">{getStatusBadge(claim.status)}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-gray-600">Ngày tạo yêu cầu:</span>
                                    <div className="text-gray-900 font-medium">{formatDate(claim.createdAt)}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <span className="text-gray-600">Thời hạn bảo hành:</span>
                                    <div className="text-gray-900 font-medium">{claim.warrantyPeriodMonths} tháng</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Ngày bắt đầu:</span>
                                    <div className="text-gray-900 font-medium">{formatDate(claim.warrantyStartDate)}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Ngày kết thúc:</span>
                                    <div className="text-gray-900 font-medium">{formatDate(claim.warrantyEndDate)}</div>
                                </div>
                                <div>
                                    <span className="text-gray-600">Serial Number:</span>
                                    <div className="text-gray-900 font-medium">{claim.serialNumber}</div>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <div className="h-20 w-20 overflow-hidden rounded-lg bg-gray-100 flex-shrink-0 mr-4">
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
                                    <p className="text-gray-600">Mã sản phẩm: {claim.orderItemId}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Problem Description */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Mô tả vấn đề</h2>
                            <div className="bg-gray-50 p-4 rounded-lg text-gray-800 mb-4">
                                {claim.description}
                            </div>

                            {claim.images && claim.images.length > 0 && (
                                <div>
                                    <h3 className="font-medium text-gray-800 mb-3">Hình ảnh đính kèm</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {claim.images.map((image, index) => (
                                            <a
                                                key={index}
                                                href={image}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
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

                    {/* Status History */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Lịch sử trạng thái</h2>
                            {claim.statusHistory && claim.statusHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {claim.statusHistory.map((history, index) => (
                                        <div key={index} className="border-l-4 border-blue-500 pl-4 pb-4 relative">
                                            <div className="absolute w-3 h-3 rounded-full bg-blue-500 -left-[6.5px] top-1"></div>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-gray-900">{getStatusBadge(history.status)}</p>
                                                    {history.notes && (
                                                        <p className="text-gray-600 mt-1">{history.notes}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm text-gray-500">{formatDate(history.createdAt)}</span>
                                                    <p className="text-xs text-gray-500">Bởi: {history.updatedBy}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-600 italic">Chưa có cập nhật trạng thái</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Customer Information */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Thông tin khách hàng</h2>
                            <div className="space-y-3">
                                <div>
                                    <span className="text-gray-600 text-sm">Tên khách hàng:</span>
                                    <p className="font-medium text-gray-900">{claim.customerName}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600 text-sm">Số điện thoại:</span>
                                    <p className="font-medium text-gray-900">{claim.customerPhone}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600 text-sm">Email:</span>
                                    <p className="font-medium text-gray-900">{claim.customerEmail || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Update Status */}
                    <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Cập nhật trạng thái</h2>
                            <div className="space-y-4">
                                <div>
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
                                        <option value="under_review">Đang xem xét</option>
                                        <option value="approved">Đã chấp nhận</option>
                                        <option value="in_progress">Đang xử lý</option>
                                        <option value="completed">Hoàn thành</option>
                                        <option value="rejected">Từ chối bảo hành</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="notes">
                                        Ghi chú cập nhật:
                                    </label>
                                    <textarea
                                        id="notes"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Nhập ghi chú về việc xử lý bảo hành..."
                                    />
                                </div>
                                <button
                                    onClick={handleUpdateStatus}
                                    disabled={processing || statusUpdate === claim.status && !notes}
                                    className={`w-full py-2.5 px-4 text-white font-medium rounded-lg ${processing
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
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
                                        'Cập nhật trạng thái'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WarrantyClaimDetailPage; 