import api from './api';
import { getAuthToken } from '../utils/auth';

const headers = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getAuthToken()}`,
});

interface OrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    warrantyPeriodMonths: number;
}

interface ShippingAddress {
    fullName: string;
    address: string;
    city: string;
    district: string;
    ward: string;
    phone: string;
    notes?: string;
}

interface OrderData {
    userId: string;
    items: OrderItem[];
    shippingAddress: ShippingAddress;
    paymentMethod: string;
    itemsPrice: number;
    shippingPrice: number;
    totalPrice: number;
    notes?: string;
    isPaid: boolean;
    paidAt: Date | null;
}

export const orderAPI = {
    createOrder: async (orderData: OrderData) => {
        try {
            console.log('Sending order data to API:', orderData);
            const response = await api.post('/orders', orderData, { headers: headers() });
            console.log('API response:', JSON.stringify(response.data, null, 2));

            // Kiểm tra cấu trúc response
            if (response.data) {
                if (response.data.data && response.data.data._id) {
                    console.log('Order ID from response:', response.data.data._id);
                } else if (response.data._id) {
                    console.log('Order ID directly from response:', response.data._id);
                    // Chuẩn hóa dữ liệu trả về để phù hợp với cấu trúc mong muốn
                    response.data = {
                        success: true,
                        data: response.data
                    };
                } else {
                    console.warn('Response does not contain order ID as expected:', response.data);
                }
            } else {
                console.error('Invalid response format from create order API');
            }

            return response;
        } catch (error: any) {
            console.error('Error creating order:', error);
            console.error('Error response data:', error.response?.data);
            console.error('Error status:', error.response?.status);
            console.error('Error headers:', error.response?.headers);
            throw error;
        }
    },

    getOrderById: async (orderId: string) => {
        try {
            console.log('Gọi API lấy thông tin đơn hàng với ID:', orderId);
            const response = await api.get(`/orders/${orderId}`, { headers: headers() });

            // Kiểm tra cấu trúc phản hồi
            if (response.data && (response.data.data || (response.data.success && response.data.data))) {
                console.log('Tìm thấy thông tin đơn hàng:', response.data.data ? 'OK' : 'Không có dữ liệu');
            } else {
                console.warn('Cấu trúc phản hồi API đơn hàng không như mong đợi:', response.data);
            }

            return response;
        } catch (error: any) {
            console.error('Lỗi khi lấy thông tin đơn hàng:', error);
            console.error('Chi tiết lỗi:', error.response?.data);
            console.error('Mã lỗi:', error.response?.status);
            throw error;
        }
    },

    getUserOrders: async () => {
        const response = await api.get('/orders/user', { headers: headers() });
        return response.data;
    },

    updatePaymentStatus: async (orderId: string, paymentData: { isPaid: boolean; paymentResult?: any }) => {
        const response = await api.put(`/orders/${orderId}/pay`, paymentData, { headers: headers() });
        return response.data;
    },

    getAllOrders: async (page = 1, limit = 10) => {
        const response = await api.get(`/orders/admin?page=${page}&limit=${limit}`, { headers: headers() });
        return response.data;
    },

    updateDeliveryStatus: async (orderId: string, status: string) => {
        const response = await api.put(`/orders/${orderId}/delivery`, { status }, { headers: headers() });
        return response.data;
    },

    startWarranty: async (orderId: string) => {
        const response = await api.put(`/orders/${orderId}/warranty/start`, {}, { headers: headers() });
        return response.data;
    },

    getWarrantyInfo: async (serialNumber: string) => {
        const response = await api.get(`/warranty/${serialNumber}`, { headers: headers() });
        return response.data;
    },

    createWarrantyClaim: async (orderItemId: string, data: {
        description: string;
        images?: string[];
        contactName?: string;
        contactPhone?: string;
        contactAddress?: string;
    }) => {
        try {
            console.log('[orderAPI.createWarrantyClaim] Gọi API tạo yêu cầu bảo hành:', {
                endpoint: `/warranty/claims/order/${orderItemId}`,
                data: {
                    ...data,
                    images: data.images ? `${data.images.length} ảnh` : 'không có ảnh'
                }
            });

            const response = await api.post(`/warranty/claims/order/${orderItemId}`, data, { headers: headers() });

            console.log('[orderAPI.createWarrantyClaim] Kết quả API:', {
                status: response.status,
                success: response.data?.success,
                message: response.data?.message,
                hasData: !!response.data?.data
            });

            return response.data;
        } catch (error: any) {
            console.error('[orderAPI.createWarrantyClaim] Lỗi khi tạo yêu cầu bảo hành:', error.message);
            console.error('[orderAPI.createWarrantyClaim] Dữ liệu lỗi:', error.response?.data);
            throw error;
        }
    },

    editWarranty: async (payload: any) => {
        try {
            console.log('[orderAPI.editWarranty] Gọi API chỉnh sửa bảo hành:', {
                endpoint: `/warranty/${payload.id}`,
                data: payload
            });

            const response = await api.put(`/warranty/${payload.id}`, payload, { headers: headers() });

            console.log('[orderAPI.editWarranty] Kết quả API:', {
                status: response.status,
                data: response.data
            });

            // Đảm bảo dữ liệu trả về đúng định dạng
            if (response.data && !response.data.success) {
                return {
                    success: true,
                    data: response.data,
                    message: 'Cập nhật bảo hành thành công'
                };
            }

            return response.data;
        }
        catch (error: any) {
            console.error('[orderAPI.editWarranty] Lỗi khi chỉnh sửa bảo hành:', error.message);
            console.error('[orderAPI.editWarranty] Chi tiết lỗi:', error.response?.data);
            throw error;
        }
    },

    updateWarrantyStatus: async (warrantyId: string, status: string, responseMessage?: string, additionalData?: {
        price?: number;
        responseMessage?: string;
        method?: string;
    }) => {
        try {
            console.log('[orderAPI.updateWarrantyStatus] Cập nhật trạng thái bảo hành:', {
                id: warrantyId,
                status: status
            });

            // Chuẩn bị dữ liệu để gửi lên
            const updateData: {
                status: string;
                responseMessage?: string;
                price?: number;
                method?: string;
            } = { status };

            // Thêm responseMessage nếu có
            if (responseMessage) {
                updateData.responseMessage = responseMessage;
            }

            // Thêm dữ liệu bổ sung nếu có
            if (additionalData) {
                // Đảm bảo giá trị price được xử lý đúng, kể cả khi giá trị là 0
                if (additionalData.price !== undefined) {
                    updateData.price = additionalData.price; // Giữ nguyên giá trị, kể cả khi là 0
                }
                if (additionalData.responseMessage !== undefined) {
                    updateData.responseMessage = additionalData.responseMessage;
                }
                if (additionalData.method !== undefined) {
                    updateData.method = additionalData.method;
                }
            }

            const response = await api.put(`/warranty/${warrantyId}`,
                updateData,
                { headers: headers() }
            );

            // Chuẩn hóa cấu trúc phản hồi để đảm bảo tính nhất quán
            let standardizedResponse;

            // Kiểm tra xem response.data có đúng cấu trúc không
            if (response.data) {
                if (response.data.success === true) {
                    // Trường hợp response đã có cấu trúc đúng {success: true, data: ...}
                    standardizedResponse = response.data;
                } else if (response.data._id) {
                    // Trường hợp response trả về trực tiếp dữ liệu warranty, không có wrapper
                    standardizedResponse = {
                        success: true,
                        data: response.data,
                        message: 'Cập nhật trạng thái bảo hành thành công'
                    };
                } else if (response.data.data && response.data.data._id) {
                    // Trường hợp response có cấu trúc {data: warranty} nhưng không có success
                    standardizedResponse = {
                        success: true,
                        data: response.data.data,
                        message: response.data.message || 'Cập nhật trạng thái bảo hành thành công'
                    };
                } else {
                    // Trường hợp không rõ cấu trúc, giả định thành công nếu status 200
                    standardizedResponse = {
                        success: response.status >= 200 && response.status < 300,
                        data: response.data,
                        message: response.data.message || 'Kết quả không xác định'
                    };
                }
            } else {
                // Không có dữ liệu trả về
                standardizedResponse = {
                    success: false,
                    data: null,
                    message: 'Không nhận được dữ liệu từ API'
                };
            }

            return standardizedResponse;
        } catch (error: any) {
            console.error('[orderAPI.updateWarrantyStatus] Lỗi khi cập nhật trạng thái:', error.message);
            throw error;
        }
    },

    getAllWarrantyClaims: async (page = 1, limit = 10, status?: string) => {
        let url = `/warranty?page=${page}&limit=${limit}`;
        if (status) {
            url += `&status=${status}`;
        }

        try {
            console.log('[orderAPI.getAllWarrantyClaims] Gọi API từ bảng Warranty:', url);
            const response = await api.get(url, { headers: headers() });
            console.log('[orderAPI.getAllWarrantyClaims] Phản hồi:', response.status, response.data?.success);
            return response;
        } catch (error: any) {
            console.error('[orderAPI.getAllWarrantyClaims] Lỗi:', error.message);
            console.error('[orderAPI.getAllWarrantyClaims] Status:', error.response?.status);
            console.error('[orderAPI.getAllWarrantyClaims] Response:', error.response?.data);
            throw error;
        }
    },

    getWarrantyClaimById: async (warrantyId: string) => {
        try {
            console.log('[orderAPI.getWarrantyClaimById] Lấy thông tin bảo hành:', warrantyId);
            const response = await api.get(`/warranty/${warrantyId}`, { headers: headers() });

            // Chuẩn hóa cấu trúc phản hồi để đảm bảo tính nhất quán
            let standardizedResponse;

            // Kiểm tra xem response.data có đúng cấu trúc không
            if (response.data) {
                if (response.data.success === true && response.data.data) {
                    // Trường hợp response đã có cấu trúc đúng {success: true, data: ...}
                    standardizedResponse = response.data;
                } else if (response.data._id) {
                    // Trường hợp response trả về trực tiếp dữ liệu warranty, không có wrapper
                    standardizedResponse = {
                        success: true,
                        data: response.data,
                        message: 'Lấy thông tin bảo hành thành công'
                    };
                } else {
                    // Trường hợp không rõ cấu trúc, giả định thành công nếu status 200
                    standardizedResponse = {
                        success: response.status >= 200 && response.status < 300,
                        data: response.data,
                        message: response.data.message || 'Kết quả không xác định'
                    };
                }
            } else {
                // Không có dữ liệu trả về
                standardizedResponse = {
                    success: false,
                    data: null,
                    message: 'Không nhận được dữ liệu từ API'
                };
            }

            return standardizedResponse;
        } catch (error: any) {
            console.error('[orderAPI.getWarrantyClaimById] Lỗi khi lấy thông tin bảo hành:', error.message);
            throw error;
        }
    },

    // Lấy danh sách sản phẩm đang trong thời gian bảo hành
    getProductsUnderWarranty: async (page = 1, limit = 10) => {
        try {
            const url = `/warranty/products?page=${page}&limit=${limit}`;
            console.log('[orderAPI.getProductsUnderWarranty] Gọi API:', url);

            const response = await api.get(url, { headers: headers() });
            console.log('[orderAPI.getProductsUnderWarranty] Phản hồi:', response.status, response.data?.success);

            return response;
        } catch (error: any) {
            console.error('[orderAPI.getProductsUnderWarranty] Lỗi:', error.message);
            console.error('[orderAPI.getProductsUnderWarranty] Status:', error.response?.status);
            console.error('[orderAPI.getProductsUnderWarranty] Response:', error.response?.data);
            throw error;
        }
    },

    // Lấy đơn hàng đã giao của người dùng hiện tại
    getUserDeliveredOrders: async () => {
        try {
            // console.log('[orderAPI.getUserDeliveredOrders] Gọi API lấy đơn hàng đã giao');
            //const response = await api.get('/orders/user/delivered', { headers: headers() });
            // console.log('[orderAPI.getUserDeliveredOrders] Kết quả API:', response.data);

            // if (response.data && response.data.data) {
            //     console.log('[orderAPI.getUserDeliveredOrders] Số lượng đơn hàng:', response.data.data.length);
            //     if (response.data.data.length > 0) {
            //         const firstOrder = response.data.data[0];
            //         console.log('[orderAPI.getUserDeliveredOrders] Đơn hàng đầu tiên:', {
            //             id: firstOrder._id,
            //             hasItems: !!firstOrder.items,
            //             itemsIsArray: Array.isArray(firstOrder.items),
            //             itemsLength: firstOrder.items ? firstOrder.items.length : 0
            //         });
            //     }
            // }
            const response = await api.get('/warranty/user')
            console.log('du lieu tra ve la: ', response.data)

            return response.data;
        } catch (error: any) {
            console.error('[orderAPI.getUserDeliveredOrders] Lỗi:', error.message);
            console.error('[orderAPI.getUserDeliveredOrders] Status:', error.response?.status);
            console.error('[orderAPI.getUserDeliveredOrders] Response:', error.response?.data);
            throw error;
        }
    },

    // Lấy danh sách yêu cầu bảo hành của người dùng hiện tại
    getUserWarrantyClaims: async () => {
        try {
            console.log('[orderAPI.getUserWarrantyClaims] Gọi API lấy yêu cầu bảo hành của người dùng');
            const response = await api.get('/warranty/user', { headers: headers() });

            console.log('[orderAPI.getUserWarrantyClaims] Kết quả API:', {
                status: response.status,
                count: response.data?.data?.length || 0
            });

            return response.data;
        } catch (error: any) {
            console.error('[orderAPI.getUserWarrantyClaims] Lỗi:', error.message);
            throw error;
        }
    },

    // Tạo yêu cầu bảo hành mới trong bảng Warranty
    createWarrantyRequest: async (data: {
        productId: string;
        description: string;
        status?: string;
        contactName?: string;
        contactPhone?: string;
        contactAddress?: string;
        images?: string[];
    }) => {
        try {
            console.log('[orderAPI.createWarrantyRequest] Gọi API tạo yêu cầu bảo hành');
            const response = await api.post(`/warranty`, data, { headers: headers() });
            return response.data;
        } catch (error: any) {
            console.error('[orderAPI.createWarrantyRequest] Lỗi khi tạo yêu cầu bảo hành:', error.message);
            throw error;
        }
    },
}