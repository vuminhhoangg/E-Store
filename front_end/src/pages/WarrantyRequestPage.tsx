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

interface OrderItem {
    _id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    warrantyPeriodMonths: number;
    serialNumber?: string;
}

interface ShippingAddress {
    fullName: string;
    address: string;
    city: string;
    district: string;
    ward: string;
    phone: string;
}

interface Order {
    _id: string;
    orderNumber?: string;
    items: OrderItem[];
    totalAmount: number;
    status: string;
    createdAt: string;
    deliveredAt?: string;
    shippingAddress?: ShippingAddress;
}

interface WarrantyFormData {
    orderId: string;
    orderItemId: string;
    description: string;
    contactName: string;
    contactPhone: string;
    contactAddress: string;
    images: File[];
}

const WarrantyRequestPage: React.FC = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<OrderItem | null>(null);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<WarrantyFormData>({
        orderId: '',
        orderItemId: '',
        description: '',
        contactName: '',
        contactPhone: '',
        contactAddress: '',
        images: []
    });
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
    const [error, setError] = useState('');

    // Thêm custom scrollbar style khi component mount
    useEffect(() => {
        const cleanup = addCustomStyle();
        return cleanup;
    }, []);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await orderAPI.getUserDeliveredOrders();

                console.log('API Response:', response);
                if (response.success) {
                    console.log('Orders data:', response.data);

                    // Kiểm tra chi tiết từng đơn hàng
                    if (response.data && response.data.length > 0) {
                        response.data.forEach((order, index) => {
                            console.log(`Đơn hàng #${index + 1}:`, {
                                id: order._id,
                                hasItems: !!order.items,
                                itemsIsArray: Array.isArray(order.items),
                                itemsLength: order.items ? order.items.length : 0,
                                items: order.items
                            });

                            // Kiểm tra chi tiết từng sản phẩm trong đơn hàng
                            if (order.items && Array.isArray(order.items)) {
                                order.items.forEach((item, i) => {
                                    console.log(`  Sản phẩm #${i + 1}:`, {
                                        id: item._id,
                                        name: item.name,
                                        warrantyPeriodMonths: item.warrantyPeriodMonths
                                    });
                                });

                                // Kiểm tra sản phẩm có bảo hành
                                const warrantyItems = order.items.filter(item => item && item.warrantyPeriodMonths > 0);
                                console.log(`  Số sản phẩm có bảo hành: ${warrantyItems.length}`);
                            }
                        });
                    }

                    // Đảm bảo mỗi order đều có items là mảng
                    const formattedOrders = response.data.map(order => ({
                        ...order,
                        items: order.items && Array.isArray(order.items) ? order.items : []
                    }));

                    setOrders(formattedOrders);
                } else {
                    console.error('API trả về thất bại:', response);
                    setError('Không thể lấy danh sách đơn hàng đã giao. Vui lòng thử lại sau.');
                }
            } catch (error) {
                console.error('Lỗi khi lấy đơn hàng đã giao:', error);
                setError('Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const handleOrderSelect = (order: Order) => {
        if (!order) return;

        // Đảm bảo order.items luôn là một mảng
        const orderWithItems = {
            ...order,
            items: order.items && Array.isArray(order.items) ? order.items : []
        };

        setSelectedOrder(orderWithItems);
        setSelectedProduct(null);
        setFormData({
            ...formData,
            orderId: orderWithItems._id || '',
            orderItemId: '',
            contactName: orderWithItems.shippingAddress?.fullName || '',
            contactPhone: orderWithItems.shippingAddress?.phone || '',
            contactAddress: orderWithItems.shippingAddress ?
                formatShippingAddress(orderWithItems.shippingAddress) :
                '',
        });
    };

    const handleProductSelect = (product: OrderItem) => {
        setSelectedProduct(product);
        setFormData({
            ...formData,
            orderItemId: product.productId,
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
        if (!formData.contactName.trim()) {
            setError('Vui lòng nhập tên liên hệ');
            return false;
        }
        if (!formData.contactPhone.trim()) {
            setError('Vui lòng nhập số điện thoại liên hệ');
            return false;
        }
        if (!formData.contactAddress.trim()) {
            setError('Vui lòng nhập địa chỉ liên hệ');
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

            console.log("Đang gửi dữ liệu bảo hành:", {
                orderItemId: formData.orderItemId,
                description: formData.description,
                contactName: formData.contactName,
                contactPhone: formData.contactPhone,
                contactAddress: formData.contactAddress,
                images: uploadedImageUrls.length ? 'Có ảnh' : 'Không có ảnh'
            });

            // Tạo yêu cầu bảo hành mới trong bảng Warranty
            const warrantyData = {
                productId: formData.orderItemId,
                description: formData.description,
                status: 'request',
                contactName: formData.contactName,
                contactPhone: formData.contactPhone,
                contactAddress: formData.contactAddress,
                images: uploadedImageUrls
            };

            // Gửi yêu cầu bảo hành
            const response = await orderAPI.createWarrantyRequest(warrantyData);

            console.log("Kết quả API tạo yêu cầu bảo hành:", response);

            if (response.success) {
                toast.success('Yêu cầu bảo hành đã được gửi thành công');

                // Chuyển hướng đến trang thành công với thông tin yêu cầu bảo hành
                const claimData = {
                    claimId: response.data?.claimNumber || response.data?._id || 'WR-' + Math.floor(Math.random() * 1000000),
                    productName: selectedProduct?.name || 'Sản phẩm'
                };

                // Lưu thông tin claim vào sessionStorage để tránh mất dữ liệu khi reload
                sessionStorage.setItem('warrantyClaimData', JSON.stringify(claimData));

                // Chuyển hướng ngay lập tức sau khi có phản hồi thành công
                navigate('/warranty-success', { state: claimData });
            } else {
                toast.error(response.message || 'Không thể gửi yêu cầu bảo hành');
            }
        } catch (error: any) {
            console.error('Lỗi khi gửi yêu cầu bảo hành:', error);
            console.error('Chi tiết lỗi:', error.response?.data || error.message);
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

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Thêm hàm để định dạng địa chỉ giao hàng
    const formatShippingAddress = (address: ShippingAddress): string => {
        // Tạo mảng mới với các phần được chuẩn hóa
        const cleanParts: { text: string, level: number }[] = [];

        // Thêm các phần có giá trị, với mức độ ưu tiên (1=cao, 4=thấp)
        if (address.address && address.address.trim())
            cleanParts.push({ text: address.address.trim(), level: 1 });
        if (address.ward && address.ward.trim())
            cleanParts.push({ text: address.ward.trim(), level: 2 });
        if (address.district && address.district.trim())
            cleanParts.push({ text: address.district.trim(), level: 3 });
        if (address.city && address.city.trim())
            cleanParts.push({ text: address.city.trim(), level: 4 });

        console.log("Địa chỉ gốc được chuẩn hóa:", cleanParts);

        // Mảng kết quả sau khi đã lọc bỏ các phần trùng lặp
        const finalParts: string[] = [];

        // Xử lý từng phần theo thứ tự ưu tiên
        for (const part of cleanParts) {
            // Kiểm tra xem phần này có trùng lặp với phần nào đã có trong kết quả không
            const isDuplicate = finalParts.some(existing =>
                existing.toLowerCase() === part.text.toLowerCase() ||
                existing.toLowerCase().includes(part.text.toLowerCase()) ||
                part.text.toLowerCase().includes(existing.toLowerCase())
            );

            if (!isDuplicate) {
                finalParts.push(part.text);
            }
        }

        const result = finalParts.join(', ');
        console.log("Kết quả định dạng địa chỉ:", result);

        return result;
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
            ) : orders.length === 0 ? (
                <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100 shadow-sm text-center">
                    <svg className="w-16 h-16 text-yellow-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-yellow-700 font-medium mb-3">Bạn chưa có đơn hàng nào đã được giao thành công.</p>
                    <Link to="/products" className="mt-2 inline-flex items-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-300">
                        <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Mua sắm ngay
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Kiểm tra xem có đơn hàng nào có sản phẩm bảo hành không */}
                    {orders.some(order =>
                        order.items && Array.isArray(order.items) &&
                        order.items.some(item => item && item.warrantyPeriodMonths > 0)
                    ) ? (
                        // Nếu có, hiển thị danh sách đơn hàng
                        orders.map((order) => (
                            <div
                                key={order._id}
                                className={`bg-white border rounded-xl overflow-hidden transition-all ${selectedOrder?._id === order._id
                                    ? 'border-blue-500 ring-1 ring-blue-200 shadow-md transform scale-[1.01]'
                                    : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'} duration-300`}
                            >
                                <div
                                    className="p-4 cursor-pointer"
                                    onClick={() => handleOrderSelect(order)}
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-sm font-bold text-gray-900 flex items-center">
                                            <svg className="w-4 h-4 mr-1.5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                            </svg>
                                            Đơn hàng #{order._id}
                                        </h3>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
                                            {formatDate(order.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2 flex items-center">
                                        <svg className="w-4 h-4 mr-1.5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Đã giao: {order.deliveredAt ? formatDate(order.deliveredAt) : 'N/A'}
                                    </p>
                                    <p className="text-sm font-medium text-gray-900 flex items-center">
                                        <svg className="w-4 h-4 mr-1.5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Tổng giá trị: {formatPrice(order.totalAmount)}
                                    </p>
                                </div>

                                {selectedOrder?._id === order._id && (
                                    <div className="border-t border-gray-200 p-4 bg-gradient-to-b from-gray-50 to-blue-50">
                                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                                            <svg className="w-4 h-4 mr-1.5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            Sản phẩm trong đơn hàng:
                                        </h4>
                                        <div className="max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                            <ul className="divide-y divide-gray-200 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
                                                {order.items && Array.isArray(order.items) && order.items.filter(item => item && item.warrantyPeriodMonths > 0).map((item) => (
                                                    <li
                                                        key={item._id}
                                                        className={`py-3 px-4 flex items-center justify-between cursor-pointer transition-colors duration-200 ${selectedProduct?._id === item._id ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}
                                                        onClick={() => handleProductSelect(item)}
                                                    >
                                                        <div className="flex items-center">
                                                            {item.image ? (
                                                                <img
                                                                    src={item.image}
                                                                    alt={item.name}
                                                                    className="h-14 w-14 object-cover rounded-lg mr-3 border border-gray-200 shadow-sm"
                                                                />
                                                            ) : (
                                                                <div className="h-14 w-14 bg-gray-200 rounded-lg mr-3 flex items-center justify-center text-gray-400 shadow-sm">
                                                                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                                                <div className="flex flex-wrap items-center mt-1 gap-1">
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                        <svg className="w-3 h-3 mr-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                                        </svg>
                                                                        Bảo hành: {item.warrantyPeriodMonths} tháng
                                                                    </span>
                                                                    {item.serialNumber && (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                            <svg className="w-3 h-3 mr-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                                                            </svg>
                                                                            SN: {item.serialNumber}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button className="inline-flex items-center px-2.5 py-1 border border-blue-100 rounded-full text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors duration-200">
                                                            <svg className="w-3 h-3 mr-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                            Chọn
                                                        </button>
                                                    </li>
                                                ))}
                                                {(!order.items || !Array.isArray(order.items) || order.items.filter(item => item && item.warrantyPeriodMonths > 0).length === 0) && (
                                                    <li className="py-4 px-4 text-sm text-gray-500 bg-gray-50 text-center">
                                                        <svg className="w-5 h-5 mx-auto mb-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Không có sản phẩm nào trong đơn hàng này có thể yêu cầu bảo hành
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        // Nếu không có sản phẩm nào có bảo hành
                        <div className="col-span-2 bg-yellow-50 p-6 rounded-xl border border-yellow-100 shadow-sm text-center">
                            <svg className="w-16 h-16 text-yellow-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <p className="text-yellow-700 font-medium mb-3">Không tìm thấy sản phẩm nào có bảo hành trong các đơn hàng đã giao của bạn.</p>
                            <p className="text-yellow-600 mb-4">Hãy mua sắm sản phẩm có bảo hành để sử dụng tính năng này.</p>
                            <Link to="/products" className="inline-flex items-center px-4 py-2 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-300">
                                <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                Mua sắm ngay
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-5">
            <div className="flex items-center mb-3">
                <button
                    type="button"
                    className="flex items-center text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium text-sm"
                    onClick={() => setStep(1)}
                >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                    </svg>
                    Quay lại chọn sản phẩm
                </button>
            </div>

            <h2 className="text-lg font-bold text-blue-700 pb-2 border-b border-blue-100 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Điền thông tin bảo hành
            </h2>

            {selectedProduct && (
                <div className="bg-gradient-to-r from-blue-50 to-gray-50 p-4 rounded-lg mb-5 border border-blue-100 shadow-sm">
                    <div className="flex items-center">
                        {selectedProduct.image ? (
                            <img
                                src={selectedProduct.image}
                                alt={selectedProduct.name}
                                className="h-16 w-16 object-cover rounded-lg mr-3 border border-gray-200 shadow-sm"
                            />
                        ) : (
                            <div className="h-16 w-16 bg-gray-200 rounded-lg mr-3 flex items-center justify-center text-gray-400">
                                <svg className="h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                        <div>
                            <h3 className="text-md font-semibold text-gray-900">{selectedProduct.name}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    <svg className="w-3 h-3 mr-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Bảo hành: {selectedProduct.warrantyPeriodMonths} tháng
                                </span>
                                {selectedProduct.serialNumber && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                        <svg className="w-3 h-3 mr-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                        </svg>
                                        Số serial: {selectedProduct.serialNumber}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100 shadow-sm">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-4 w-4 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Mô tả lỗi <span className="text-red-500">*</span>
                    </label>
                    <div>
                        <textarea
                            id="description"
                            name="description"
                            rows={3}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
                            placeholder="Mô tả chi tiết vấn đề bạn gặp phải với sản phẩm"
                            value={formData.description}
                            onChange={handleInputChange}
                        />
                        <p className="mt-1 text-xs text-gray-500">Vui lòng mô tả chi tiết vấn đề để chúng tôi có thể hỗ trợ tốt nhất.</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hình ảnh (tối đa 5 ảnh)
                    </label>
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                        {formData.images.length < 5 && (
                            <label className="cursor-pointer bg-white border-2 border-dashed border-gray-300 rounded-lg p-2 flex flex-col items-center justify-center w-24 h-24 hover:bg-gray-50 transition-colors duration-300">
                                <svg className="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span className="text-xs text-gray-500 mt-1 text-center">Thêm ảnh</span>
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
                            <div key={index} className="relative group">
                                <img
                                    src={url}
                                    alt={`preview ${index}`}
                                    className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                                />
                                <button
                                    type="button"
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200 shadow-sm"
                                    onClick={() => removeImage(index)}
                                >
                                    <svg className="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">Tải lên hình ảnh mô tả vấn đề của sản phẩm (mỗi ảnh tối đa 5MB).</p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="border-b border-gray-200 pb-3 mb-3">
                        <h3 className="text-md font-medium text-gray-900 flex items-center">
                            <svg className="w-4 h-4 mr-1.5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Thông tin liên hệ
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                                Tên liên hệ <span className="text-red-500">*</span>
                            </label>
                            <div>
                                <input
                                    type="text"
                                    id="contactName"
                                    name="contactName"
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
                                    value={formData.contactName}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                                Số điện thoại <span className="text-red-500">*</span>
                            </label>
                            <div>
                                <input
                                    type="tel"
                                    id="contactPhone"
                                    name="contactPhone"
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
                                    value={formData.contactPhone}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label htmlFor="contactAddress" className="block text-sm font-medium text-gray-700 mb-1">
                                Địa chỉ <span className="text-red-500">*</span>
                            </label>
                            <div>
                                <input
                                    type="text"
                                    id="contactAddress"
                                    name="contactAddress"
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200"
                                    value={formData.contactAddress}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="bg-white py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                            onClick={() => setStep(1)}
                        >
                            Quay lại
                        </button>
                        <button
                            type="submit"
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang xử lý...
                                </>
                            ) : 'Gửi yêu cầu bảo hành'}
                        </button>
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
                    Gửi yêu cầu bảo hành cho sản phẩm bạn đã mua. Chỉ những sản phẩm đã được giao thành công mới có thể yêu cầu bảo hành.
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
                        <span className="font-semibold">Xem lịch sử yêu cầu bảo hành</span>
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