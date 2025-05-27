import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { orderAPI } from '../services/orders';

// Thêm CSS inline cho thanh cuộn tùy chỉnh
const customScrollbarStyle = `
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #c0c0c0;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}
`;

// Thêm style vào document
const addCustomStyle = () => {
    const styleEl = document.createElement('style');
    styleEl.textContent = customScrollbarStyle;
    document.head.appendChild(styleEl);

    return () => {
        document.head.removeChild(styleEl);
    };
};

// Cập nhật interface cho sản phẩm bảo hành
interface WarrantyProduct {
    _id: string;
    productId: {
        _id: string;
        name: string;
        image?: string;
        warrantyPeriodMonths: number;
    } | string;
    customerId: {
        _id: string;
        userName: string;
        name?: string;
        phone?: string;
    } | string;
    orderId?: {
        _id: string;
        orderNumber?: string;
        createdAt?: string;
        deliveredAt?: string;
        shippingAddress?: {
            fullName: string;
            address: string;
            city: string;
            district: string;
            ward: string;
            phone: string;
        } | any;
    } | any;
    productName?: string;
    status: string;
    endDate?: string;
    startDate?: string;
    serialNumber?: string;
    orderNumber?: string;
    createdAt: string;
    updatedAt: string;
}

interface WarrantyFormData {
    productId: string;
    description: string;
    contactName: string;
    contactPhone: string;
    contactAddress: string;
    images: File[];
}

const WarrantyRequestPage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<WarrantyProduct[]>([]);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<WarrantyProduct | null>(null);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<WarrantyFormData>({
        productId: '',
        description: '',
        contactName: '',
        contactPhone: '',
        contactAddress: '',
        images: []
    });
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
    const [error, setError] = useState('');

    // Thêm state cho phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 6;

    // Thêm custom scrollbar style khi component mount
    useEffect(() => {
        const cleanup = addCustomStyle();
        return cleanup;
    }, []);

    useEffect(() => {
        const fetchWarrantyProducts = async () => {
            try {
                setLoading(true);
                const response = await orderAPI.getUserDeliveredOrders(); // API này thực tế gọi /warranty/user

                if (response.success) {
                    if (response.data && response.data.length > 0) {

                        // Lọc sản phẩm có bảo hành hợp lệ
                        const currentDate = new Date();
                        const validWarrantyProducts = response.data.filter(item => {
                            // Bỏ điều kiện kiểm tra trạng thái - hiển thị tất cả sản phẩm có trong bảng warranty
                            // const isApproved = item.status === 'approved';

                            // Chỉ kiểm tra còn trong thời hạn bảo hành
                            let isValid = true;
                            if (item.endDate) {
                                const endDate = new Date(item.endDate);
                                isValid = endDate > currentDate;
                            }

                            // Kiểm tra có thông tin sản phẩm
                            const hasProductInfo = item.productId && (
                                (typeof item.productId === 'object' && item.productId.name) ||
                                item.productName
                            );

                            // Chỉ cần có thông tin sản phẩm và còn trong thời hạn bảo hành
                            return isValid && hasProductInfo;
                        });

                        // Sắp xếp theo thời gian tạo (mới nhất lên đầu)
                        const sortedProducts = validWarrantyProducts.sort((a, b) => {
                            const dateA = new Date(a.createdAt);
                            const dateB = new Date(b.createdAt);
                            return dateB.getTime() - dateA.getTime();
                        });

                        setProducts(sortedProducts);
                        // Reset về trang đầu khi có dữ liệu mới
                        setCurrentPage(1);
                    } else {
                        setProducts([]);
                    }
                } else {
                    setError('Không thể lấy danh sách sản phẩm bảo hành. Vui lòng thử lại sau.');
                }
            } catch (error) {
                setError('Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchWarrantyProducts();
    }, []);

    // Hàm để kiểm tra xem sản phẩm có thể chọn được không
    const isProductSelectable = (product: WarrantyProduct): boolean => {
        const nonSelectableStatuses = ['received', 'processing', 'completed'];
        return !nonSelectableStatuses.includes(product.status.toLowerCase());
    };

    const handleProductSelect = (product: WarrantyProduct) => {
        // Kiểm tra xem sản phẩm có thể chọn được không
        if (!isProductSelectable(product)) {
            toast.warning('Sản phẩm này đã có yêu cầu bảo hành đang được xử lý hoặc đã hoàn thành');
            return;
        }

        setSelectedProduct(product);
        setSelectedProductId(product._id);

        // Lấy thông tin khách hàng để điền sẵn form
        const customerInfo = typeof product.customerId === 'object' ? product.customerId : null;

        setFormData({
            productId: product._id,
            description: '',
            contactName: customerInfo?.name || customerInfo?.userName || '',
            contactPhone: customerInfo?.phone || '',
            contactAddress: '',
            images: []
        });
        setStep(2);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);

            // Giới hạn số lượng file (tối đa 5)
            if (formData.images.length + filesArray.length > 5) {
                toast.warning('Bạn chỉ có thể tải lên tối đa 5 hình ảnh');
                return;
            }

            // Kiểm tra kích thước file (tối đa 5MB mỗi file)
            const validFiles = filesArray.filter(file => {
                if (file.size > 5 * 1024 * 1024) {
                    toast.warning(`File ${file.name} quá lớn. Kích thước tối đa là 5MB`);
                    return false;
                }
                return true;
            });

            setFormData({
                ...formData,
                images: [...formData.images, ...validFiles]
            });

            // Tạo URL preview cho các file ảnh
            const newImagePreviewUrls = validFiles.map(file => URL.createObjectURL(file));
            setImagePreviewUrls([...imagePreviewUrls, ...newImagePreviewUrls]);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...formData.images];
        newImages.splice(index, 1);

        const newImagePreviewUrls = [...imagePreviewUrls];
        URL.revokeObjectURL(newImagePreviewUrls[index]); // Giải phóng URL
        newImagePreviewUrls.splice(index, 1);

        setFormData({
            ...formData,
            images: newImages
        });
        setImagePreviewUrls(newImagePreviewUrls);
    };

    const validateForm = () => {
        if (!formData.description.trim()) {
            setError('Vui lòng mô tả vấn đề của sản phẩm');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            // Tải ảnh lên trước (giả định có API endpoint riêng để upload ảnh)
            let uploadedImageUrls: string[] = [];
            if (formData.images.length > 0) {
                // Ở đây sẽ gọi API upload ảnh và lấy về URL
                // uploadedImageUrls = await Promise.all(formData.images.map(image => uploadImage(image)));
                uploadedImageUrls = formData.images.map((_, index) => `https://example.com/image${index}.jpg`);
            }



            // Tạo yêu cầu bảo hành mới trong bảng Warranty
            const warrantyData = {
                id: formData.productId,
                description: formData.description,
                status: 'request',
            };

            // Gửi yêu cầu bảo hành
            const response = await orderAPI.editWarranty(warrantyData);

            if (response.success) {
                toast.success('Yêu cầu bảo hành đã được gửi thành công');

                // Chuyển hướng đến trang thành công với thông tin yêu cầu bảo hành
                const productName = typeof selectedProduct?.productId === 'object'
                    ? selectedProduct.productId.name
                    : selectedProduct?.productName || 'Sản phẩm';

                const claimData = {
                    claimId: response.data?.claimNumber || response.data?._id || 'WR-' + Math.floor(Math.random() * 1000000),
                    productName: productName
                };

                // Lưu thông tin claim vào sessionStorage để tránh mất dữ liệu khi reload
                sessionStorage.setItem('warrantyClaimData', JSON.stringify(claimData));

                // Chuyển hướng ngay lập tức sau khi có phản hồi thành công
                navigate('/warranty-success', { state: claimData });
            } else {
                toast.error(response.message || 'Không thể gửi yêu cầu bảo hành');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Đã xảy ra lỗi khi gửi yêu cầu bảo hành');
        } finally {
            setLoading(false);
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

    // Hàm để lấy tên sản phẩm
    const getProductName = (product: WarrantyProduct): string => {
        if (typeof product.productId === 'object' && product.productId.name) {
            return product.productId.name;
        }
        return product.productName || 'Sản phẩm không xác định';
    };

    // Hàm để lấy hình ảnh sản phẩm
    const getProductImage = (product: WarrantyProduct): string | undefined => {
        if (typeof product.productId === 'object' && product.productId.image) {
            return product.productId.image;
        }
        return undefined;
    };

    // Hàm để lấy thời hạn bảo hành
    const getWarrantyPeriod = (product: WarrantyProduct): number => {
        if (typeof product.productId === 'object' && product.productId.warrantyPeriodMonths) {
            return product.productId.warrantyPeriodMonths;
        }
        return 12; // Mặc định 12 tháng
    };

    // Hàm để lấy thông tin thời gian mua
    const getPurchaseDate = (product: WarrantyProduct): string => {
        // Ưu tiên lấy từ orderId.createdAt, sau đó đến createdAt của warranty
        if (typeof product.orderId === 'object' && product.orderId.createdAt) {
            return formatDate(product.orderId.createdAt);
        }
        if (product.startDate) {
            return formatDate(product.startDate);
        }
        return formatDate(product.createdAt);
    };

    // Hàm để lấy số đơn hàng
    const getOrderNumber = (product: WarrantyProduct): string => {
        // Ưu tiên lấy ID của đơn hàng thực tế
        if (typeof product.orderId === 'object' && product.orderId && product.orderId._id) {
            return product.orderId._id;
        }
        if (typeof product.orderId === 'string' && product.orderId.trim()) {
            return product.orderId;
        }
        if (product.orderNumber && product.orderNumber.trim()) {
            return product.orderNumber;
        }

        // Fallback - hiển thị ID warranty thay vì WR-xxx
        return product._id;
    };

    // Hàm để lấy tên và màu sắc trạng thái bảo hành
    const getWarrantyStatus = (status: string): { name: string; color: string } => {
        switch (status.toLowerCase()) {
            case 'approved':
                return { name: 'Đã kích hoạt', color: 'bg-green-100 text-green-800' };
            case 'request':
                return { name: 'Đang yêu cầu', color: 'bg-yellow-100 text-yellow-800' };
            case 'pending':
                return { name: 'Chờ xử lý', color: 'bg-gray-100 text-gray-800' };
            case 'processing':
                return { name: 'Đang xử lý', color: 'bg-blue-100 text-blue-800' };
            case 'completed':
                return { name: 'Hoàn thành', color: 'bg-green-100 text-green-800' };
            case 'rejected':
                return { name: 'Từ chối', color: 'bg-red-100 text-red-800' };
            case 'sending':
                return { name: 'Đang gửi', color: 'bg-indigo-100 text-indigo-800' };
            case 'received':
                return { name: 'Đã nhận', color: 'bg-purple-100 text-purple-800' };
            default:
                return { name: status, color: 'bg-gray-100 text-gray-800' };
        }
    };

    // Logic phân trang
    const totalPages = Math.ceil(products.length / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const currentProducts = products.slice(startIndex, endIndex);

    // Hàm xử lý chuyển trang
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        // Reset selection khi chuyển trang
        setSelectedProductId(null);
        setSelectedProduct(null);
        // Scroll to top khi chuyển trang
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            handlePageChange(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            handlePageChange(currentPage + 1);
        }
    };

    const renderStep1 = () => (
        <div className="space-y-6">
            <h2 className="text-lg font-bold text-blue-700 pb-2 border-b border-blue-100 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Chọn sản phẩm cần bảo hành
            </h2>

            {loading ? (
                <div className="flex justify-center py-16">
                    <svg className="animate-spin h-12 w-12 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            ) : error ? (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">{error}</h3>
                        </div>
                    </div>
                </div>
            ) : products.length === 0 ? (
                <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100 shadow-sm text-center">
                    <svg className="w-16 h-16 text-yellow-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-yellow-700 font-medium mb-3">Bạn chưa có sản phẩm nào có thể tạo yêu cầu bảo hành.</p>
                    <div className="text-yellow-600 mb-4 text-sm">
                        <p>Có thể do một trong những lý do sau:</p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Chưa có sản phẩm nào được thêm vào hệ thống bảo hành</li>
                            <li>Các sản phẩm đã hết thời hạn bảo hành</li>
                        </ul>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link to="/products" className="inline-flex items-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-300">
                            <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            Mua sắm ngay
                        </Link>
                        <Link to="/warranty-history" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-300">
                            <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Quản lý yêu cầu bảo hành
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Thông tin tổng quan */}
                    {products.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-lg border border-blue-100">
                                <div className="flex items-center text-sm text-blue-700">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="font-medium">
                                        Tìm thấy {products.length} sản phẩm có thể tạo yêu cầu bảo hành
                                    </span>
                                </div>
                                {totalPages > 1 && (
                                    <div className="text-sm text-blue-600">
                                        Trang {currentPage} / {totalPages}
                                    </div>
                                )}
                            </div>

                            {/* Thông báo về sản phẩm không thể chọn */}
                            <div className="bg-amber-50 px-4 py-3 rounded-lg border border-amber-200">
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 text-amber-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <div className="text-sm text-amber-700">
                                        <p className="font-medium mb-1">Lưu ý:</p>
                                        <p>Các sản phẩm có trạng thái <span className="font-semibold">"Đã nhận"</span>, <span className="font-semibold">"Đang xử lý"</span> hoặc <span className="font-semibold">"Hoàn thành"</span> không thể tạo yêu cầu bảo hành mới.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <ul className="divide-y divide-gray-200 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                        {currentProducts.map((product) => {
                            const isSelected = selectedProductId === product._id;
                            const isSelectable = isProductSelectable(product);

                            // Debug để kiểm tra selection
                            if (isSelected) {
                                console.log('Sản phẩm được chọn:', {
                                    productId: product._id,
                                    selectedProductId,
                                    isSelected,
                                    productName: getProductName(product)
                                });
                            }

                            return (
                                <li
                                    key={product._id}
                                    className={`py-4 px-4 flex items-center justify-between transition-all duration-200 ${!isSelectable
                                        ? "bg-gray-100 border-l-4 border-l-gray-300 opacity-60 cursor-not-allowed"
                                        : isSelected
                                            ? "bg-blue-50 border-l-4 border-l-blue-500 shadow-sm cursor-pointer"
                                            : "hover:bg-gray-50 border-l-4 border-l-transparent cursor-pointer"
                                        }`}
                                    style={isSelected ? {
                                        borderLeftColor: '#3b82f6',
                                        borderLeftWidth: '4px',
                                        borderLeftStyle: 'solid',
                                        backgroundColor: '#eff6ff'
                                    } : {}}
                                    onClick={() => isSelectable && handleProductSelect(product)}
                                    title={!isSelectable ? `Sản phẩm này đã có yêu cầu bảo hành ở trạng thái "${getWarrantyStatus(product.status).name}" và không thể tạo yêu cầu mới` : ''}
                                >
                                    <div className="flex items-center">
                                        {getProductImage(product) ? (
                                            <img
                                                src={getProductImage(product)}
                                                alt={getProductName(product)}
                                                className="h-16 w-16 object-cover rounded-lg mr-4 border border-gray-200 shadow-sm"
                                            />
                                        ) : (
                                            <div className="h-16 w-16 bg-gray-200 rounded-lg mr-4 flex items-center justify-center text-gray-400 shadow-sm">
                                                <svg
                                                    className="h-8 w-8"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center">
                                                <p className="text-base font-semibold text-gray-900">{getProductName(product)}</p>
                                                {!isSelectable && (
                                                    <svg className="w-4 h-4 ml-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                                <span className="inline-flex items-center">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    Ngày mua: {getPurchaseDate(product)}
                                                </span>
                                            </p>
                                            <div className="flex flex-wrap items-center mt-2 gap-2">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    <svg
                                                        className="w-3 h-3 mr-1"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                        />
                                                    </svg>
                                                    Bảo hành: {getWarrantyPeriod(product)} tháng
                                                </span>
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getWarrantyStatus(product.status).color}`}>
                                                    <svg
                                                        className="w-3 h-3 mr-1"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 12l2 2 4-4m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        />
                                                    </svg>
                                                    {getWarrantyStatus(product.status).name}
                                                </span>
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    <svg
                                                        className="w-3 h-3 mr-1"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                        />
                                                    </svg>
                                                    Đơn hàng: {getOrderNumber(product)}
                                                </span>
                                                {product.endDate && (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <svg
                                                            className="w-3 h-3 mr-1"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                        Hết hạn: {formatDate(product.endDate)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {isSelectable ? (
                                        <button className="inline-flex items-center px-3 py-2 border border-blue-200 rounded-lg text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors duration-200">
                                            <svg
                                                className="w-4 h-4 mr-1"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                            Chọn
                                        </button>
                                    ) : (
                                        <div className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-gray-200 text-gray-500 cursor-not-allowed">
                                            <svg
                                                className="w-4 h-4 mr-1"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                            Chọn
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    {/* Thêm phân trang */}
                    {products.length > productsPerPage && (
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm space-y-3 sm:space-y-0">
                            <div className="flex items-center text-sm text-gray-700 order-2 sm:order-1">
                                <span>
                                    Hiển thị <span className="font-medium">{startIndex + 1}</span> đến{' '}
                                    <span className="font-medium">{Math.min(endIndex, products.length)}</span> trong{' '}
                                    <span className="font-medium">{products.length}</span> sản phẩm
                                </span>
                            </div>

                            <div className="flex items-center space-x-1 sm:space-x-2 order-1 sm:order-2">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={currentPage === 1}
                                    className={`inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${currentPage === 1
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                        }`}
                                >
                                    <svg className="w-4 h-4 sm:mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    <span className="hidden sm:inline">Trước</span>
                                </button>

                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                        // Trên mobile chỉ hiển thị trang hiện tại và 2 trang xung quanh
                                        const isMobile = window.innerWidth < 640;
                                        const showPage = isMobile
                                            ? (page >= currentPage - 1 && page <= currentPage + 1)
                                            : (page === 1 ||
                                                page === totalPages ||
                                                (page >= currentPage - 1 && page <= currentPage + 1));

                                        if (!showPage) {
                                            // Hiển thị dấu ... nếu cần
                                            if (page === currentPage - 2 || page === currentPage + 2) {
                                                return (
                                                    <span key={page} className="px-1 sm:px-2 py-1 text-gray-500 text-xs sm:text-sm">
                                                        ...
                                                    </span>
                                                );
                                            }
                                            return null;
                                        }

                                        return (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-200 ${currentPage === page
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={handleNextPage}
                                    disabled={currentPage === totalPages}
                                    className={`inline-flex items-center px-2 sm:px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${currentPage === totalPages
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                                        }`}
                                >
                                    <span className="hidden sm:inline">Sau</span>
                                    <svg className="w-4 h-4 sm:ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6">
            <div className="flex items-center mb-4">
                <button
                    type="button"
                    className="group flex items-center px-4 py-2 text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded-full transition-all duration-300 font-medium text-sm shadow-sm hover:shadow-md transform hover:scale-105"
                    onClick={() => setStep(1)}
                >
                    <svg className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    Quay lại chọn sản phẩm
                </button>
            </div>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold text-white flex items-center">
                    <div className="bg-white/20 p-3 rounded-xl mr-4">
                        <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <div>
                        <span className="block">Điền thông tin bảo hành</span>
                        <span className="text-blue-100 text-sm font-normal mt-1 block">Vui lòng cung cấp thông tin chi tiết về vấn đề của sản phẩm</span>
                    </div>
                </h2>
            </div>

            {selectedProduct && (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center">
                        <div className="relative">
                            {getProductImage(selectedProduct) ? (
                                <img
                                    src={getProductImage(selectedProduct)}
                                    alt={getProductName(selectedProduct)}
                                    className="h-20 w-20 object-cover rounded-xl border-2 border-gray-200 shadow-md"
                                />
                            ) : (
                                <div className="h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center text-gray-400 shadow-md">
                                    <svg className="h-10 w-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                            )}
                            <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <div className="ml-5 flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{getProductName(selectedProduct)}</h3>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 shadow-sm">
                                    <svg className="w-4 h-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Bảo hành: {getWarrantyPeriod(selectedProduct)} tháng
                                </span>
                                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-green-200 text-green-800 shadow-sm">
                                    <svg className="w-4 h-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Đã chọn
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-xl border border-red-200 shadow-lg">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <div className="bg-red-100 p-2 rounded-lg">
                                    <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-sm font-semibold text-red-800 mb-1">Có lỗi xảy ra</h3>
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center mb-4">
                        <div className="bg-orange-100 p-3 rounded-xl mr-4">
                            <svg className="w-6 h-6 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-lg font-semibold text-gray-800 mb-1">
                                Mô tả vấn đề <span className="text-red-500">*</span>
                            </label>
                            <p className="text-sm text-gray-600">Chi tiết về tình trạng và vấn đề của sản phẩm</p>
                        </div>
                    </div>
                    <div>
                        <textarea
                            id="description"
                            name="description"
                            rows={4}
                            className="block w-full border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-300 p-4 resize-none hover:border-gray-300"
                            placeholder="Ví dụ: Sản phẩm không hoạt động, có tiếng kêu lạ, màn hình bị hỏng, không sạc được pin..."
                            value={formData.description}
                            onChange={handleInputChange}
                        />
                        <div className="mt-3 flex items-center text-xs text-gray-500">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Mô tả càng chi tiết càng giúp chúng tôi hỗ trợ bạn tốt hơn
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center mb-4">
                        <div className="bg-purple-100 p-3 rounded-xl mr-4">
                            <svg className="w-6 h-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <label className="block text-lg font-semibold text-gray-800 mb-1">
                                Hình ảnh minh họa
                            </label>
                            <p className="text-sm text-gray-600">Tải lên tối đa 5 hình ảnh về vấn đề của sản phẩm</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {formData.images.length < 5 && (
                            <label className="group cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center aspect-square hover:from-blue-50 hover:to-blue-100 hover:border-blue-300 transition-all duration-300 transform hover:scale-105">
                                <div className="bg-white p-3 rounded-full shadow-sm group-hover:shadow-md transition-shadow duration-300">
                                    <svg className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <span className="text-xs text-gray-500 mt-2 text-center font-medium group-hover:text-blue-600 transition-colors duration-300">Thêm ảnh</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                        )}

                        {imagePreviewUrls.map((url, index) => (
                            <div key={index} className="relative group aspect-square">
                                <img
                                    src={url}
                                    alt={`preview ${index}`}
                                    className="w-full h-full object-cover rounded-xl border-2 border-gray-200 shadow-md group-hover:shadow-lg transition-all duration-300"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all duration-300"></div>
                                <button
                                    type="button"
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 opacity-0 group-hover:opacity-100"
                                    onClick={() => removeImage(index)}
                                >
                                    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-start">
                            <svg className="w-4 h-4 text-purple-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-purple-700 leading-relaxed">
                                <span className="font-medium">Gợi ý:</span> Chụp ảnh rõ nét các vị trí hỏng hóc, lỗi hiển thị, hoặc bất thường của sản phẩm.
                                Mỗi ảnh tối đa 5MB, định dạng JPG, PNG.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 shadow-lg">
                    <div className="border-b border-blue-200 pb-4 mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                            <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                <svg className="w-5 h-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            Thông tin liên hệ
                        </h3>
                        <p className="text-sm text-gray-600 mt-2 ml-12">Thông tin này được lấy từ địa chỉ giao hàng của đơn hàng</p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-center">
                                <div className="bg-green-100 p-2 rounded-lg mr-3">
                                    <svg className="w-4 h-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Tên người liên hệ
                                    </label>
                                    <p className="text-base font-semibold text-gray-900">
                                        {selectedProduct?.orderId?.shippingAddress?.fullName || 'Chưa có thông tin'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-center">
                                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                                    <svg className="w-4 h-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Số điện thoại
                                    </label>
                                    <p className="text-base font-semibold text-gray-900">
                                        {selectedProduct?.orderId?.shippingAddress?.phone || 'Chưa có thông tin'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div className="flex items-start">
                                <div className="bg-purple-100 p-2 rounded-lg mr-3 mt-1">
                                    <svg className="w-4 h-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                        Địa chỉ liên hệ
                                    </label>
                                    <p className="text-base font-semibold text-gray-900 leading-relaxed">
                                        {selectedProduct?.orderId?.shippingAddress ? (
                                            <>
                                                {selectedProduct.orderId.shippingAddress.address}

                                            </>
                                        ) : 'Chưa có thông tin'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-start">
                            <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs text-blue-700 leading-relaxed">
                                <span className="font-medium">Lưu ý:</span> Thông tin liên hệ này sẽ được sử dụng để liên hệ với bạn trong quá trình xử lý bảo hành.
                                Nếu cần thay đổi thông tin, vui lòng liên hệ với bộ phận chăm sóc khách hàng.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-6">
                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-200 shadow-lg">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex items-center text-sm text-gray-600">
                                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Yêu cầu sẽ được xử lý trong vòng 24-48 giờ</span>
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    className="flex-1 sm:flex-none group bg-white py-3 px-6 border-2 border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300 transform hover:scale-105"
                                    onClick={() => setStep(1)}
                                >
                                    <span className="flex items-center justify-center">
                                        <svg className="w-4 h-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                        Quay lại
                                    </span>
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 sm:flex-none group inline-flex justify-center items-center py-3 px-8 border border-transparent shadow-lg text-sm font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Đang xử lý...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                            <span>Gửi yêu cầu bảo hành</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-gradient-to-b from-gray-50 to-blue-50 min-h-screen">
            <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold text-blue-600 tracking-tight">Yêu cầu bảo hành</h1>
                <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
                    Gửi yêu cầu bảo hành cho sản phẩm bạn đã mua. Bạn có thể gửi nhiều yêu cầu bảo hành cho cùng một sản phẩm nếu cần thiết.
                </p>

                {/* Nút xem lịch sử bảo hành */}
                <div className="mt-6">
                    <Link
                        to="/warranty-history"
                        className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-medium text-sm transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:from-purple-600 hover:to-indigo-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400"
                    >
                        <svg className="w-5 h-5 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span className="font-semibold">Quản lý yêu cầu bảo hành</span>
                    </Link>
                </div>
            </div>

            <div className="bg-white shadow-lg rounded-xl p-5 md:p-6 border border-blue-100 transition-all duration-300 hover:shadow-blue-100/30">
                {/* Hiển thị các bước */}
                <div className="mb-6">
                    <div className="flex items-center justify-center">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step === 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'} font-bold text-md shadow-md`}>
                            1
                        </div>
                        <div className={`h-1.5 w-16 md:w-24 ${step === 1 ? 'bg-gray-300' : 'bg-blue-600'} rounded-full transition-all duration-300`}></div>
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step === 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'} font-bold text-md shadow-md`}>
                            2
                        </div>
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-gray-600 px-6">
                        <div className={`font-medium ${step === 1 ? 'text-blue-600' : ''}`}>Chọn sản phẩm</div>
                        <div className={`font-medium ${step === 2 ? 'text-blue-600' : ''}`}>Nhập thông tin</div>
                    </div>
                </div>

                {step === 1 ? renderStep1() : renderStep2()}
            </div>
        </div>
    );
};

export default WarrantyRequestPage; 